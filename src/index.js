import Phaser from "phaser";

import {BootScene} from "./scene/boot/BootScene"; 
import {LoadingScene} from "./LoadingScene";

import {BasicsScene} from "./scene/basics/BasicsScene"; 
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
  //parent: "app",
  backgroundColor: "#9bd4c3",
  width: 16*100,
  height: 16*100, 
  scale: {
    //mode: Scale.ScaleModes.NONE,
    width: window.innerWidth,
    height: window.innerHeight,
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
  scene: [ LoadingScene, BasicsScene, JuniorScene, UIScene],
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
