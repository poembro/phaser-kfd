import Phaser from "phaser";

import { ScoreOperations, GameStatus ,LEVELS, EVENTS_NAME} from "./consts";
import {onlinePlayers} from './lib/net/SocketServer';

 
export class UIScene extends Phaser.Scene {
    props = null
    gameEndPhrase = null

    constructor() {
        super("UIScene"); 
    }

    preload() {
    } 

    create(props) { 
        this.props = props
        this.initListeners();
    }
    initListeners() {
        this.game.events.once(EVENTS_NAME.gameEnd, this.gameEndHandler, this);
    }

    gameEndHandler (item) { // 游戏结束标识
        let status = item.status
        let scene = item.scene
        this.cameras.main.setBackgroundColor("rgba(0,0,0,0.6)");
        this.game.scene.pause(scene) // 暂停游戏场景
   
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
  
        this.gameEndPhrase.setPosition(this.game.scale.width / 2 - this.gameEndPhrase.width / 2, this.game.scale.height * 0.4)
  
        // 监听键盘 按下点击
        this.input.on("pointerdown", () => { 
           this.game.events.off(EVENTS_NAME.gameEnd, this.gameEndHandler);
          this.scene.get(scene).scene.restart(this.props);
          this.scene.restart(this.props);
        })
    }

 
  
 
}