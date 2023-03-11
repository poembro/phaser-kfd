import scarabPNG from "../../assets/boot/earthbound-scarab.png";

export class BootScene extends Phaser.Scene {

    constructor ()
    {
        super('BootScene');

        //  Sphinx
        this.location1 = new Phaser.Math.Vector2(766, 1090);

        //  Oasis
        this.location2 = new Phaser.Math.Vector2(225, 1552);

        //  Tomb
        this.location3 = new Phaser.Math.Vector2(700, 1592);

        //  City Gates
        this.location4 = new Phaser.Math.Vector2(323, 480);

        //  Chair
        this.location5 = new Phaser.Math.Vector2(593, 274);

        //  River Hormuz
        this.location6 = new Phaser.Math.Vector2(180, 1087);

        //  Guard Outpost
        this.location7 = new Phaser.Math.Vector2(168, 163);
    }

    preload ()
    {
        this.load.image('map', scarabPNG);
    }

    create ()
    {
        this.cameras.main.setBounds(0, 0, 1024, 2048);

        this.add.image(0, 0, 'map').setOrigin(0);

        this.cameras.main.setZoom(1);
        this.cameras.main.centerOn(0, 0);

        var pos = 1;
 
        var total = 1
        this.input.on('pointerdown', function () {

            var cam = this.cameras.main;
            var location = this['location' + pos];
            var rndZoom = Phaser.Math.FloatBetween(0.5, 4);

            cam.pan(location.x, location.y, 3000, 'Sine.easeInOut');
            cam.zoomTo(rndZoom, 3000);

            pos++;

            if (pos === 8)
            { 
                pos = 1;  
            }


            total++
            if (total > 8) {
                 // 走完流程直接销毁自己
                //this.scene.get("TipScene")
                this.scene.remove("TipScene") 
                this.scene.start('LoadingScene'); 
                this.scene.remove('BootScene'); 
                //this.sys.game.destroy(true); 删除所有场景了
            }
            

        }, this);
        
        this.scene.add('TipScene', TipScene, true, { x: 0, y: 0 });

        //this.scene.launch('TipScene');
    }

}

class TipScene extends Phaser.Scene {

    constructor ()
    {
        super('TipScene');

        this.mapScene;
        this.mapCamera;

        this.graphics;

        this.tooltip1;
        this.tooltip2;
        this.tooltip3;
        this.tooltip4;
        this.tooltip5;
        this.tooltip6;
        this.tooltip7;
    }

    create ()
    {
        this.mapScene = this.scene.get('BootScene');

        this.mapCamera = this.mapScene.cameras.main;

        this.graphics = this.add.graphics();

        this.tooltip1 = this.add.text(0, 0).setText('出生地');
        this.tooltip2 = this.add.text(0, 0).setText('小学');
        this.tooltip3 = this.add.text(0, 0).setText('初中');
        this.tooltip4 = this.add.text(0, 0).setText('高中');
        this.tooltip5 = this.add.text(0, 0).setText('大学');
        this.tooltip6 = this.add.text(0, 0).setText('工作');
        this.tooltip7 = this.add.text(0, 0).setText('退休');
    }

    update ()
    {
        this.graphics.clear();

        this.updateToolTip(this.mapScene.location1, this.tooltip1);
        this.updateToolTip(this.mapScene.location2, this.tooltip2);
        this.updateToolTip(this.mapScene.location3, this.tooltip3);
        this.updateToolTip(this.mapScene.location4, this.tooltip4);
        this.updateToolTip(this.mapScene.location5, this.tooltip5);
        this.updateToolTip(this.mapScene.location6, this.tooltip6);
        this.updateToolTip(this.mapScene.location7, this.tooltip7);
    }

    updateToolTip (source, tooltip)
    {
        var basePosition = source;
        var camera = this.mapCamera;

        //  The marker point
        var x = (basePosition.x - camera.worldView.x) * camera.zoom;
        var y = (basePosition.y - camera.worldView.y) * camera.zoom;

        var graphics = this.graphics;

        graphics.fillStyle(0x000000, 0.8);
        graphics.lineStyle(4, 0x000000, 0.8);

        //  The text is above this point
        var width = tooltip.width + 32;
        var height = tooltip.height + 32;

        var bx = x - width / 2;
        var by = y - (height + 32);

        graphics.fillRect(bx, by, width, height);

        tooltip.x = bx + 16;
        tooltip.y = by + 16;

        graphics.lineBetween(bx + 16, by + height, x, y);
    }

}

/**  
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true,
    parent: 'phaser-example',
    scene: [ BootScene, TipScene ]
};

const game = new Phaser.Game(config);
*/