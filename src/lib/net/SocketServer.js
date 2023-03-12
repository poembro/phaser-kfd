import "google-protobuf"  
import pushPb from './push_pb'

let onlinePlayers = [];
let domainHttp = "http://127.0.0.1:14020"
let domainWs = "ws://127.0.0.1:14020"

//let domainHttp = "http://47.111.69.116:8080"
//let domainWs = "ws://47.111.69.116:8080"

class SocketServer {
    // 基础属性
    memberId = 0
    nickname = ""
    token = ""

    ws = null
    fn = null

    
    // 用户属性
    memberinfo = {}
    // 仓库
    memberinfo = {}

    // 
    //heartbeatInterval  = null
    constructor() {
    }

    login (nickname, password) {
        let resp  = this.ajax({
            type:"GET",
            url:domainHttp + "/v2/ws/comet/GetToken",
            data:{
                id: this.getQuery("id") ? this.getQuery("id") :this.getRnd(1,100000),
                nickname : nickname,
                password: password
            }
        })
        if (!resp || !resp.data || !resp.data.token ) {
            return false
        }
        this.token = resp.data.token 
        this.nickname = resp.data.nickname
        this.memberId = resp.data.id
        return true
    }

    getQuery (name){
        var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if(r!=null)return  unescape(r[2]); return null;
    }

    conn(fn){
        this.fn = fn  
        let self = this
        
    
        let ws = new WebSocket( domainWs +'/v2/ws?token=' +  self.token);
        self.ws = ws
        ws.binaryType = 'arraybuffer';
        ws.onopen         = () => {
            self.onopen()
            //self.heartbeatInterval = setInterval(self.heartbeat, 30 * 1000);
        };
        ws.onclose        = (e) => { self.onclose(e); }
        ws.onmessage     =  (e) => { self.onMessage(e);}
    }

    onopen(evt) {
        // 上报位置. 
        let x = this.getRnd(3200,3268)
        let y = this.getRnd(3480,34900)
        this.send({
            event:'PLAYER_FIRST_POS',
            x: x,
            y:y,
        })
        /**
        this.fn({
            event:'PLAYER_JOINED',
            memberId:this.memberId,
            x: x,
            y:y,
            map:"town",
        })
        */
    }
    
    onMessage(evt) {
        var self = this
        var bodydata = evt.data;
        var p = pushPb.Proto.deserializeBinary(bodydata)
        switch(p.getOp()) {
            case 3:
                break;
            case 9:
                break;
            case 29:
                let  offlineTmps  = pushPb.Offline.deserializeBinary(p.getBody())
                offlineTmps.getOpsList().forEach((v) => {
                    let memberId = parseInt(v) 
                    self.fn({
                        event:'PLAYER_CLOSE',
                        memberId:memberId
                    })
                })
                break
            case 41: // 处理 消息
                let  bcTmp  = pushPb.Broadcast.deserializeBinary(p.getBody())
                let bcBodytmp = bcTmp.getBody()
                let bcBody = JSON.parse(bcBodytmp)
                if (bcBody.length <= 0) break
                self.fn(bcBody)
                break
            case 39: // 处理 位置  
                let  tmps  = pushPb.PosResp.deserializeBinary(p.getBody())
                tmps.getDataList().forEach((v) => {
                    let dst = v.getOpsList()
                    if (dst.length != 6) {
                      console.log("------",dst)
                      return
                    }
                    console.log(dst)
                    self.fn({
                        event:'PLAYER_MOVED',
                        memberId:dst[0],
                        x: dst[1],
                        y:dst[2],
                        action:dst[3],
                    })
                })
                break
            default: 
                break
        }
    }


    send(data) {
        var self = this
        // 获取周边
        if (data.event == "PLAYER_FIRST_POS")  {
            let pb = new pushPb.Proto()
            pb.setVer(1) 
            pb.setOp(38)

            let posReqPb = new pushPb.PosReq()
            posReqPb.addOps(data.x,1)
            posReqPb.addOps(data.y,2)
            posReqPb.addOps(1,3)  //朝向
            posReqPb.addOps(0,4)   
            posReqPb.addOps(0,5)  
            let tdata= posReqPb.serializeBinary()
            pb.setBody(tdata)
            let body = pb.serializeBinary()
            self.ws.send(body)
            return
        }

        // 同步位置
        if (data.event == "PLAYER_MOVED")  {
            let pb2 = new pushPb.Proto()
            pb2.setVer(1) 
            pb2.setOp(32)
            let posReqPb2 = new pushPb.PosReq()
            posReqPb2.addOps(parseInt(data.x),1)
            posReqPb2.addOps(parseInt(data.y),2)
            posReqPb2.addOps(0,3)  //动作: 如 方位/朝向
            posReqPb2.addOps(0,4)  // 舞动
            posReqPb2.addOps(0,5) 
            let tdata2= posReqPb2.serializeBinary()
            pb2.setBody(tdata2)
            let body = pb2.serializeBinary()
            self.ws.send(body)
            return
        }

        // 离开
        if (data.event == "PLAYER_CLOSE")  {
            let pb = new pushPb.Proto()
            pb.setVer(1) 
            pb.setOp(29) 
            let body = pb.serializeBinary()
            self.ws.send(body)
            return
        }

        // 广播数据
        if (data.event == "PLAYER_BROADCAST")  {
            let pb = new pushPb.Proto()
            pb.setVer(1) 
            pb.setOp(40) 
            let broadcastPb = new pushPb.Broadcast()
            let bcStr = JSON.stringify(data)
            broadcastPb.setBody(bcStr)
            let tdata= broadcastPb.serializeBinary()
            pb.setBody(tdata)
            let body = pb.serializeBinary()
            self.ws.send(body)
            return
        }
        
    }


        
    onclose(v) {
        var self = this
        //if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        let memberId = parseInt(this.memberId) 
        self.fn({
            event:'PLAYER_CLOSE',
            memberId:memberId
        })
    }

    heartbeat(){
        let pb = new pushPb.Proto()
        pb.setVer(1)
        pb.setOp(2)
        let hbPb = new pushPb.Heartbeat()
        hbPb.setBody("hb")
        let hbSerializeData = hbPb.serializeBinary()
        pb.setBody(hbSerializeData)
        let body =pb.serializeBinary()
        this.ws.send(body)
    }

    
    getRnd(min, max){
		return Math.floor(Math.random() * (max - min + 1)) + min
	}

    ajax (opts) {
        var xhr = new XMLHttpRequest(),
            type = opts.type || 'GET',
            url = opts.url,
            params = opts.data,
            //dataType = opts.dataType || 'json';
        
        type = type.toUpperCase();
        
        if (type === 'GET') {
            params = (function(obj){
                var str = '';
                for(var prop in obj){
                    str += prop + '=' + obj[prop] + '&'
                }
                str = str.slice(0, str.length - 1);
                return str;
            })(opts.data);
            url += url.indexOf('?') === -1 ? '?' + params : '&' + params;
        }
        
        // xhr.open的第三个参数为false表示同步请求
        xhr.open(type, url, false);
        
        if (opts.contentType) {
            xhr.setRequestHeader('Content-type', opts.contentType);
        }
        
        xhr.send(params ? params : null);
        console.log(xhr)
        if (xhr.status === 200) {
           return JSON.parse(xhr.response)
        }
        
        return JSON.parse(xhr.responseText)
        /**
        return new Promise(function (resolve, reject) {
            //onload are executed just after the sync request is comple，
            //please use 'onreadystatechange' if need support IE9-
            xhr.onload = function () {
                if (xhr.status === 200) {
                    var result;
                    try {
                      result = JSON.parse(xhr.response);
                    } catch (e) {
                      result = xhr.response;
                    }
                    resolve(result);
                } else {
                    reject(xhr.response);
                }
            };
            
        });
        */
    }
}


   

export {onlinePlayers,SocketServer };
