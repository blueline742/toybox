# Contractor Guidelines

## Code Standards
1. **No hardcoded secrets** - Use .env.local for any keys
2. **No external dependencies** without approval
3. **No obfuscated code** - All code must be readable
4. **No cryptocurrency miners** or hidden scripts
5. **Comment complex logic**

## Required for Each Card
- [ ] Card data in enhancedCharacters.js
- [ ] 3 unique abilities with animations
- [ ] Sound effects for abilities
- [ ] Proper damage/effect calculations in game.js
- [ ] Mobile-responsive positioning
- [ ] Test on both player sides

## Testing Checklist
- [ ] Cards render correctly on both screens
- [ ] Abilities trigger with correct animations
- [ ] Damage applies to correct targets
- [ ] Turn switching works properly
- [ ] Mobile UI is functional
- [ ] No console errors

## Submission Process
1. Push changes to `contractor-razi` branch
2. Create Pull Request with description
3. Tag specific changes made
4. Include before/after screenshots
5. List any new dependencies added

## Payment Triggers
- Milestone 1: 2 cards complete ($200)
- Milestone 2: 4 more cards ($200)
- Milestone 3: Final 2 cards + bugs ($200)
- Final: Tested & approved ($100)

## Red Flags (Will void payment)
- Hidden API calls to external servers
- Code that phones home
- Malicious packages in package.json
- Attempts to access .env or secrets
- Obfuscated/encrypted code blocks