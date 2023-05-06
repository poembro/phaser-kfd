import Phaser from "phaser"

export default class Message extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
    
        // 添加交互事件
        this.setInteractive();
        this.on('pointerdown', (e) => {
          this.showDialog();
         
        });
    
        // 定义对话内容
        this.dialogs = [
          { question: '你好，我能问你些问题吗？', answer: '当然可以。' },
          { question: '你喜欢吃什么？', answer: '我其实不需要食物。' },
          { question: '你能帮助我解决这个难题吗？', answer: '抱歉，我没有做过这个任务。' }
        ];
    }
    
    showDialog() {
        var self = this
        // 显示对话框
        let dialogBox = this.scene.add.graphics();
        dialogBox.fillStyle(0x000000, 0.7);
        dialogBox.fillRect(50, 50, 500, 200);
    
        // 添加文本和输入框
        let questionText = this.scene.add.text(70, 70, '请输入问题：', { fontSize: '18px', color: '#ffffff' });
        let inputBox = this.scene.add.dom(270, 110, 'input', { type: 'text', fontSize: '18px', color: '#000000', backgroundColor: '#ffffff' });
    
        // 添加提交按钮
        let submitButton = this.scene.add.text(360, 150, '提交', { fontSize: '18px', color: '#ffffff' })
          .setInteractive()
          .on('pointerdown', () => {
            // 获取玩家输入的问题
            let question = inputBox.node.value;
    
            // 根据问题查询回答
            let answer = '';
            for (let i = 0; i < this.dialogs.length; i++) {
              if (this.dialogs[i].question == question) {
                answer = this.dialogs[i].answer;
                break;
              }
            }
    
            // 显示回答
            let answerText = this.scene.add.text(70, 150, answer, { fontSize: '18px', color: '#ffffff' });
            self.scene.time.delayedCall(1000 * 3, () => {
                answerText.destroy(); 
            })

            // 销毁对话框和文本框
            dialogBox.destroy();
            questionText.destroy();
            inputBox.node.remove();
            submitButton.destroy();
        });
    }


	

}


