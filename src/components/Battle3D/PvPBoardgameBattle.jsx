import React from 'react';
import BoardgamePvPWithLobby from './BoardgamePvPWithLobby';

// Simply delegate to the BoardgamePvPWithLobby component
const PvPBoardgameBattle = (props) => {
  return <BoardgamePvPWithLobby {...props} />;
};

export default PvPBoardgameBattle;