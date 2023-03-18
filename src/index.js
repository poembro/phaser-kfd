import Phaser from "phaser";

//import {BootScene} from "./scene/boot/BootScene"; 
import {LoadingScene} from "./LoadingScene";

//import {BasicsScene} from "./scene/basics/BasicsScene"; 
import {JuniorScene} from "./scene/junior/JuniorScene"; 

import {UIScene} from "./UIScene";
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js'



const DEFAULT_WIDTH = document.documentElement.clientWidth
const DEFAULT_HEIGHT = document.documentElement.clientHeight


var game;
window.onload = function () {
  const Config = {
    title:"phaser mmo game",
    url: "http://www.abc.com",
    version: "1.0.0",
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: "#9bd4c3",
    width: DEFAULT_WIDTH, // 游戏的宽度，单位为游戏像素。
    height: 800, //游戏的高度，单位为游戏像素。
    // https://juejin.cn/post/6844904110785822734
    scale: {// 属性定义了Phaser的画布宽高，缩放。
      //mode: Scale.ScaleModes.NONE,// mode属性定义缩放模式   Scale.ScaleModes.NONE 不缩放，canvas保持width，height定义的宽高。
      width: window.innerWidth,
      height: window.innerHeight,
      //autoCenter: Scale.CENTER_BOTH, //水平方向以及垂直方向都局中   autoCenter定义了 canvas 元素相对于其父元素对齐方式 
      autoRound:true,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 }, // 整个游戏的重力，当然，每个舞台都可以独立进行设置
        fps: 60, // 游戏帧率，这边简单给不爱玩游戏的小伙伴解释一下，它指的是游戏每秒的刷新次数，越高的话就越流畅，反之越卡。但是越高对性能影响越大，设置为60基本就够了。需要注意的是，这边设置的并不是真实的游戏刷新频率，只是会参与到真实刷新频率的计算当中
        debug: false,
      },
    },
    render: {
      antialiasGL: false,
      pixelArt: true,
    },
    
    callbacks: {
      preBoot: () => {}, //在引导序列开始时运行的函数。
      postBoot: () => {  }, //在引导序列末尾运行的函数。
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
        key: 'VirtualJoystick',
        plugin: VirtualJoystickPlugin,
        mapping: 'joystickPlugin'

      }]
    }
  };
  game = new Phaser.Game(Config);
  window.focus();
  resize();
  window.addEventListener('resize', resize, false); 
}



function resize() {
  var canvas = document.querySelector('canvas');
  var windowWidth = window.innerWidth;
  var windowHeight = window.innerHeight;
  var windowRatio = windowWidth / windowHeight;
  var gameRatio =  game.config.width / game.config.height;
  if (windowRatio < gameRatio) {
    canvas.style.width = windowWidth + 'px';
    canvas.style.height = (windowWidth / gameRatio) + 'px';
  } else {
    canvas.style.width = (windowHeight * gameRatio) + 'px';
    canvas.style.height = windowHeight + 'px';
  }
}

function sizeChanged() {
  // isBooted 指示游戏实例何时完成引导过程的标志。
  if (window.game.isBooted) {
    setTimeout(() => {
      window.game.scale.resize(window.innerWidth, window.innerHeight);
      window.game.canvas.setAttribute("style", `display: block; width: ${window.innerWidth}px; height: ${window.innerHeight}px;`);
    }, 100);
  }
}