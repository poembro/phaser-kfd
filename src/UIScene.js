import Phaser from "phaser";

import { ScoreOperations, GameStatus ,LEVELS, EVENTS_NAME} from "./consts";
import {onlinePlayers} from './net/SocketServer';

 
export class UIScene extends Phaser.Scene {
    score = null
    levelName = ""
    gameEndPhrase = null
    scoreValue = 0

    constructor() {
        super("ui-scene"); 
    }

    preload() {
    } 

    create(props) { 
        this.levelName = props.name; //props.name = Level-1
        this.score = this.add.text(20,20,0).setFontSize(12).setOrigin(0.8, 0.5);
        this.initListeners();
    }
    initListeners() {
        this.game.events.on(EVENTS_NAME.chestLoot, this.chestLootHandler, this);
        this.game.events.once(EVENTS_NAME.gameEnd, this.gameEndHandler, this);
    }

    gameEndHandler (status) { // 游戏结束标识
        this.cameras.main.setBackgroundColor("rgba(0,0,0,0.6)");
        this.game.scene.pause("game-scene") // 暂停游戏场景
   
        // 成功失败文字
        this.gameEndPhrase = this.add.text(
          this.game.scale.width / 2,
          this.game.scale.height * 0.4,
          status === GameStatus.LOSE
            ? `失败!\n\n点击屏幕重新开始`
            : `胜利!\n\n点击屏幕重新开始`
        )
          .setAlign("center").setOrigin(0.8, 0.5)
          .setColor(status === GameStatus.LOSE ? "#ff0000" : "#ffffff");
  
        this.gameEndPhrase.setPosition(
          this.game.scale.width / 2 - this.gameEndPhrase.width / 2,
          this.game.scale.height * 0.4
        )
  
        // 监听键盘 按下点击
        this.input.on("pointerdown", () => { 
          this.game.events.off(EVENTS_NAME.chestLoot, this.chestLootHandler);
          this.game.events.off(EVENTS_NAME.gameEnd, this.gameEndHandler);
          this.scene.get("game-scene").scene.restart({ name: "Level-1" });
          this.scene.restart({ name: "Level-1" });
        })
    }

    chestLootHandler(opt) { // 捡到宝贝作为通关依据
        let self = this
        this.changeValue(this.score, ScoreOperations.INCREASE, 10);

        const currentIndex = LEVELS.findIndex((item) => item.name === self.levelName);

        if (LEVELS[currentIndex].score === this.scoreValue) {
            console.log("-----opt.sessionId--被销毁--", opt,"------", onlinePlayers)
            let memberId = parseInt(opt.memberId)
            if (onlinePlayers[memberId]) delete onlinePlayers[memberId]

            const nextLevel = LEVELS[currentIndex + 1]
            if (nextLevel) {
                this.game.events.off(EVENTS_NAME.chestLoot, this.chestLootHandler)
                this.game.events.off(EVENTS_NAME.gameEnd, this.gameEndHandler)

                this.scene.get("game-scene").scene.restart({ name: nextLevel.name })
                this.scene.restart({ name: nextLevel.name })
                this.levelName = nextLevel.name
            } else {
                if (this.scoreValue === 100) {
                    this.game.events.emit(EVENTS_NAME.gameEnd, GameStatus.WIN);
                }
            }
        }
    }

    changeValue(score, op , value) {
        switch (op) {
        case ScoreOperations.INCREASE:
            this.scoreValue += value;
            break;
        case ScoreOperations.DECREASE:
            this.scoreValue -= value;
            break;
        case ScoreOperations.SET_VALUE:
            this.scoreValue = value;
            break;
        default:
            break;
        } 
        score.setText(`得分: ${this.scoreValue}`);
    }
 
}
