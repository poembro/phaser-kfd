import Phaser from "phaser";
import {LoadingScene} from "./LoadingScene";
import {GameScene} from "./GameScene";
import {UIScene} from "./UIScene";


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
  width: 1920,
  height: 1080,
  
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
  scene: [LoadingScene, GameScene, UIScene],
  winScore: 100,
};

window.onresize = () => sizeChanged();
window.game = new Phaser.Game(Config);
