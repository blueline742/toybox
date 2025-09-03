use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod toybox_brawl {
    use super::*;

    pub fn create_battle(
        ctx: Context<CreateBattle>,
        battle_id: String,
        wager_amount: u64,
    ) -> Result<()> {
        let battle = &mut ctx.accounts.battle;
        let clock = Clock::get()?;
        
        battle.player1 = ctx.accounts.player1.key();
        battle.player2 = Pubkey::default();
        battle.battle_id = battle_id;
        battle.wager_amount = wager_amount;
        battle.total_pot = wager_amount;
        battle.state = BattleState::WaitingForOpponent;
        battle.created_at = clock.unix_timestamp;
        battle.winner = None;
        
        // Transfer wager from player1 to escrow
        anchor_lang::solana_program::program::invoke(
            &system_instruction::transfer(
                &ctx.accounts.player1.key(),
                &ctx.accounts.escrow.key(),
                wager_amount,
            ),
            &[
                ctx.accounts.player1.to_account_info(),
                ctx.accounts.escrow.to_account_info(),
            ],
        )?;
        
        Ok(())
    }

    pub fn join_battle(ctx: Context<JoinBattle>) -> Result<()> {
        let battle = &mut ctx.accounts.battle;
        
        require!(
            battle.state == BattleState::WaitingForOpponent,
            ErrorCode::BattleNotJoinable
        );
        
        battle.player2 = ctx.accounts.player2.key();
        battle.total_pot = battle.wager_amount * 2;
        battle.state = BattleState::InProgress;
        
        // Transfer wager from player2 to escrow
        anchor_lang::solana_program::program::invoke(
            &system_instruction::transfer(
                &ctx.accounts.player2.key(),
                &ctx.accounts.escrow.key(),
                battle.wager_amount,
            ),
            &[
                ctx.accounts.player2.to_account_info(),
                ctx.accounts.escrow.to_account_info(),
            ],
        )?;
        
        Ok(())
    }

    pub fn submit_battle_result(
        ctx: Context<SubmitResult>,
        winner: Pubkey,
    ) -> Result<()> {
        let battle = &mut ctx.accounts.battle;
        
        require!(
            battle.state == BattleState::InProgress,
            ErrorCode::BattleNotInProgress
        );
        
        require!(
            winner == battle.player1 || winner == battle.player2,
            ErrorCode::InvalidWinner
        );
        
        battle.winner = Some(winner);
        battle.state = BattleState::Completed;
        
        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let battle = &ctx.accounts.battle;
        
        require!(
            battle.state == BattleState::Completed,
            ErrorCode::BattleNotCompleted
        );
        
        require!(
            battle.winner == Some(ctx.accounts.winner.key()),
            ErrorCode::NotTheWinner
        );
        
        // Calculate winnings (90% to winner, 10% burn)
        let total_pot = battle.total_pot;
        let winner_share = (total_pot * 90) / 100;
        let burn_amount = total_pot - winner_share;
        
        // Transfer winnings from escrow to winner
        **ctx.accounts.escrow.try_borrow_mut_lamports()? -= winner_share;
        **ctx.accounts.winner.try_borrow_mut_lamports()? += winner_share;
        
        // Burn remaining 10%
        **ctx.accounts.escrow.try_borrow_mut_lamports()? -= burn_amount;
        **ctx.accounts.burn_address.try_borrow_mut_lamports()? += burn_amount;
        
        Ok(())
    }

    pub fn cancel_battle(ctx: Context<CancelBattle>) -> Result<()> {
        let battle = &mut ctx.accounts.battle;
        let clock = Clock::get()?;
        
        require!(
            battle.state == BattleState::WaitingForOpponent,
            ErrorCode::CannotCancelInProgressBattle
        );
        
        // Check if 5 minutes have passed
        require!(
            clock.unix_timestamp > battle.created_at + 300,
            ErrorCode::CancelTimeNotReached
        );
        
        battle.state = BattleState::Cancelled;
        
        // Refund player1
        **ctx.accounts.escrow.try_borrow_mut_lamports()? -= battle.wager_amount;
        **ctx.accounts.player1.try_borrow_mut_lamports()? += battle.wager_amount;
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(battle_id: String)]
pub struct CreateBattle<'info> {
    #[account(
        init,
        payer = player1,
        space = 8 + Battle::INIT_SPACE,
        seeds = [b"battle", battle_id.as_bytes()],
        bump
    )]
    pub battle: Account<'info, Battle>,
    
    #[account(mut)]
    pub player1: Signer<'info>,
    
    /// CHECK: Escrow account for holding wagers
    #[account(
        mut,
        seeds = [b"escrow", battle_id.as_bytes()],
        bump
    )]
    pub escrow: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinBattle<'info> {
    #[account(mut)]
    pub battle: Account<'info, Battle>,
    
    #[account(mut)]
    pub player2: Signer<'info>,
    
    /// CHECK: Escrow account for holding wagers
    #[account(mut)]
    pub escrow: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitResult<'info> {
    #[account(mut)]
    pub battle: Account<'info, Battle>,
    
    #[account(address = oracle_authority::ID)]
    pub oracle: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub battle: Account<'info, Battle>,
    
    #[account(mut)]
    pub winner: Signer<'info>,
    
    /// CHECK: Escrow account
    #[account(mut)]
    pub escrow: AccountInfo<'info>,
    
    /// CHECK: Burn address (system program)
    #[account(
        mut,
        address = anchor_lang::solana_program::system_program::ID
    )]
    pub burn_address: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CancelBattle<'info> {
    #[account(mut)]
    pub battle: Account<'info, Battle>,
    
    #[account(mut)]
    pub player1: Signer<'info>,
    
    /// CHECK: Escrow account
    #[account(mut)]
    pub escrow: AccountInfo<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Battle {
    pub player1: Pubkey,
    pub player2: Pubkey,
    #[max_len(32)]
    pub battle_id: String,
    pub wager_amount: u64,
    pub total_pot: u64,
    pub state: BattleState,
    pub winner: Option<Pubkey>,
    pub created_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum BattleState {
    WaitingForOpponent,
    InProgress,
    Completed,
    Cancelled,
}

pub mod oracle_authority {
    use super::*;
    declare_id!("OracleAuthority111111111111111111111111111");
}

#[error_code]
pub enum ErrorCode {
    #[msg("Battle is not joinable")]
    BattleNotJoinable,
    #[msg("Battle is not in progress")]
    BattleNotInProgress,
    #[msg("Invalid winner specified")]
    InvalidWinner,
    #[msg("Battle is not completed")]
    BattleNotCompleted,
    #[msg("You are not the winner")]
    NotTheWinner,
    #[msg("Cannot cancel a battle in progress")]
    CannotCancelInProgressBattle,
    #[msg("Cancel time not reached (5 minutes)")]
    CancelTimeNotReached,
}