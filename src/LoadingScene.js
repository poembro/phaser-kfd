import kingPNG from "./assets/sprites/king.png";

// 玩家
import kingAtlasPNG from "./assets/spritesheets/a-king_withmask.png";
import kingAtlasJSON from "./assets/spritesheets/a-king_atlas.json";


// 怪物
import lizardAtlasPNG from "./assets/spritesheets/lizard.png";
import lizardAtlasJSON from "./assets/spritesheets/lizard.json";




// tiled 软件导出的json 地图
import GrassPNG from "./assets/tilemaps/json/Grass.png"; 
import GrassJSON from "./assets/tilemaps/json/Grass.json";


import foodPNG from "./assets/spritesheets/food.png"


import {SocketServer} from './lib/net/SocketServer';


 

export class LoadingScene extends Phaser.Scene {

 
    constructor() {
        super("LoadingScene")
    }

    preload() {
        //this.load.baseURL = "http://localhost:8080/assets/";
        this.load.image("king", kingPNG);

        // 加载图集：.atlas(key [, textureURL] [, atlasURL] [, textureXhrSettings] [, atlasXhrSettings])
        this.load.atlas("a-king", kingAtlasPNG, kingAtlasJSON) // 玩家
        this.load.atlas("lizard", lizardAtlasPNG,lizardAtlasJSON) // 蜥蜴 
 
     
        // 读取assets/sprites/fire.json文件，并命名为fire，第三个参数则是图片的路径
        // this.load.multiatlas('fire', 'assets/sprites/fire.json', 'assets/sprites')
         // 地图加载
        this.load.image("Grass", GrassPNG)// 图块图片。  
        this.load.tilemapTiledJSON("GrassJson", GrassJSON);
    
        this.load.spritesheet("food", foodPNG, {frameWidth: 32, frameHeight: 32})
 

        // 登录 
        this.load.html('nameform', "https://labs.phaser.io/assets/text/loginform.html");

    }

    create() {
        this.createLogin() 
    }
    joinWorld(net){
        this.scene.start("JuniorScene", {name: "GrassJson",SocketServer:net })
        this.scene.start("UIScene", {name: "GrassJson",SocketServer:net})
    }
    createLogin() { 
        var self = this
        var text = this.add.text(10, 10, 'Please login to play', { color: 'white', fontFamily: 'Arial', fontSize: '32px '});
        var element = this.add.dom(400, 600).createFromCache('nameform');
 
        element.setPerspective(800);
        element.addListener('click');
        element.on('click', function (event) { 
            if (event.target.name === 'loginButton')
            {
                var inputUsername = this.getChildByName('username');
                var inputPassword = this.getChildByName('password');
    
                //  Have they entered anything?
                if (inputUsername.value !== '' && inputPassword.value !== '')
                {
                    console.log("inputUsername.value -->", inputUsername.value , "     inputPassword.value --->", inputPassword.value )

                    // 登录 ajax 
                    let net = new SocketServer()
                    if (!net.login(inputUsername.value, inputPassword.value)) {
                        this.scene.tweens.add({ targets: text, alpha: 0.1, duration: 200, ease: 'Power3', yoyo: true });
                        return
                    }

                    //  Turn off the click events
                    this.removeListener('click');
    
                    //  Tween the login form out
                    this.scene.tweens.add({ targets: element.rotate3d, x: 1, w: 90, duration: 3000, ease: 'Power3' });
    
                    this.scene.tweens.add({ targets: element, scaleX: 2, scaleY: 2, y: 700, duration: 3000, ease: 'Power3',
                        onComplete: function ()
                        {
                            element.setVisible(false);

                            self.joinWorld(net)
                        }
                    });
    
                    //  Populate the text with whatever they typed in as the username!
                   text.setText('Welcome ' + inputUsername.value);
                   
                }
                else
                {
                    //  Flash the prompt
                    this.scene.tweens.add({ targets: text, alpha: 0.1, duration: 200, ease: 'Power3', yoyo: true });
                }
            }
        });

        this.tweens.add({
            targets: element,
            y: 300,
            duration: 3000,
            ease: 'Power3'
        });
    }
 
}
