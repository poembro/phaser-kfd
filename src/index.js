import Phaser from "phaser";

//import {BootScene} from "./scene/boot/BootScene"; 
import {LoadingScene} from "./LoadingScene";

//import {BasicsScene} from "./scene/basics/BasicsScene"; 
import {JuniorScene} from "./scene/junior/JuniorScene"; 

import {UIScene} from "./UIScene";
//import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';

function sizeChanged() {
  // isBooted 指示游戏实例何时完成引导过程的标志。
  if (window.game.isBooted) {
    setTimeout(() => {
      window.game.scale.resize(window.innerWidth, window.innerHeight);
      window.game.canvas.setAttribute("style", `display: block; width: ${window.innerWidth}px; height: ${window.innerHeight}px;`);
    }, 100);
  }
}


const Config = {
  type: Phaser.AUTO,
  backgroundColor: "#9bd4c3",
  width: 16*100,
  height: 16*100, 
  // https://juejin.cn/post/6844904110785822734
  scale: {// 属性定义了Phaser的画布宽高，缩放。
    //mode: Scale.ScaleModes.NONE,// mode属性定义缩放模式   Scale.ScaleModes.NONE 不缩放，canvas保持width，height定义的宽高。
    width: window.innerWidth,
    height: window.innerHeight,
    //autoCenter: Scale.CENTER_BOTH, //水平方向以及垂直方向都局中   autoCenter定义了 canvas 元素相对于其父元素对齐方式 
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  render: {
    antialiasGL: false,
    pixelArt: true,
  },
  parent: 'phaser-example',
  callbacks: {
    postBoot: () => {
      sizeChanged();
    },
  },
  canvasStyle: `display: block; width: 100%; height: 100%;`,
  autoFocus: true,
  audio: {
    disableWebAudio: false,
  },
  dom: {
    createContainer: true
  },
  scene: [ LoadingScene, JuniorScene, UIScene],
  winScore: 100,
  plugins:{
    global: [{
      //key: 'rexVirtualJoystick',
      //plugin: VirtualJoystickPlugin,
      //start: true

    }]
  }
};

window.onresize = () => sizeChanged();
window.game = new Phaser.Game(Config);
