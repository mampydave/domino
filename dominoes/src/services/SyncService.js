import PlayerRepository from './../database/PlayerRepository';
import GameRepository from './../database/GameRepository';


const SyncService = {
  async getAllUnsyncedData() {
    return {
      players: await PlayerRepository.getUnsyncedPlayers(),
      funds: await GameRepository.getUnsyncedFunds(),
      winners: await GameRepository.getUnsyncedWinners(),
      losses: await GameRepository.getUnsyncedLosses(),
    };
  }
};

export default SyncService;
