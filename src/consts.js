// 敌人走位
export var Direction = {
  UP : 0,
  DOWN : 1,
  LEFT : 2,
  RIGHT : 3,
}

// 人物是否活着
export var GameStatus = {
  WIN : 0,
  LOSE : 1,
}

// 事件名字
export var EVENTS_NAME = {
  addPh : "app-pd",
  gameEnd : "game-end",
  chestLoot : "chest-loot",
  attack : "attack",
}

// 下一关卡 条件配置
export var LEVELS = [
  {
    name : "Level-1",
    score : 30,
  },
  {
    name : "Level-2",
    score : 100,
  },
];

// 分值加减
export var ScoreOperations = {
  INCREASE : 0,
  DECREASE : 1,
  LESET_VALUEFT : 2, 
}
