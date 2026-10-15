import{execute}from'./execute.mjs';if(!['h001','h002'].includes(process.argv[2]))throw Error('ONLY_H001_H002_AUTHORIZED');await execute('B');
