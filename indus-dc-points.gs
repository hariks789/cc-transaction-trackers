function calculateIndus6XRewardPoints(amount) {
  let rewardPoints = 0;

  if (amount <= 5000) {
    rewardPoints += Math.floor(amount / 200) * 2;
  } else if (amount <= 10000) {
    rewardPoints += Math.floor(5000 / 200) * 2;
    rewardPoints += Math.floor((amount - 5000) / 200) * 3;
  } else if (amount <= 20000) {
    rewardPoints += Math.floor(5000 / 200) * 2;
    rewardPoints += Math.floor((10000 - 5000) / 200) * 3;
    rewardPoints += Math.floor((amount - 10000) / 200) * 4;
  } else if (amount <= 40000) {
    rewardPoints += Math.floor(5000 / 200) * 2;
    rewardPoints += Math.floor((10000 - 5000) / 200) * 3;
    rewardPoints += Math.floor((20000 - 10000) / 200) * 4;
    rewardPoints += Math.floor((amount - 20000) / 200) * 5;
  } else {
    rewardPoints += Math.floor(5000 / 200) * 2;
    rewardPoints += Math.floor((10000 - 5000) / 200) * 3;
    rewardPoints += Math.floor((20000 - 10000) / 200) * 4;
    rewardPoints += Math.floor((40000 - 20000) / 200) * 5;
    rewardPoints += Math.floor((amount - 40000) / 200) * 6;
  }

  return Math.min(rewardPoints, 3000);
}
//https://www.indusind.com/in/en/personal/cards/indus-rewards.html

function calculateIndus5XRewardPoints(amount) {
  let rewardPoints = 0;

  if (amount <= 5000) {
    rewardPoints += Math.floor(amount / 200);
  } else if (amount <= 10000) {
    rewardPoints += Math.floor(5000 / 200);
    rewardPoints += Math.floor((amount - 5000) / 200) * 2;
  } else if (amount <= 20000) {
    rewardPoints += Math.floor(5000 / 200);
    rewardPoints += Math.floor((10000 - 5000) / 200) * 2;
    rewardPoints += Math.floor((amount - 10000) / 200) * 3;
  } else if (amount <= 40000) {
    rewardPoints += Math.floor(5000 / 200);
    rewardPoints += Math.floor((10000 - 5000) / 200) * 2;
    rewardPoints += Math.floor((20000 - 10000) / 200) * 3;
    rewardPoints += Math.floor((amount - 20000) / 200) * 4;
  } else {
    rewardPoints += Math.floor(5000 / 200);
    rewardPoints += Math.floor((10000 - 5000) / 200) * 2;
    rewardPoints += Math.floor((20000 - 10000) / 200) * 3;
    rewardPoints += Math.floor((40000 - 20000) / 200) * 4;
    rewardPoints += Math.floor((amount - 40000) / 200) * 5;
  }

  return Math.min(rewardPoints, 3000);
}
