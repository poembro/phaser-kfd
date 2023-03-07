import "google-protobuf"  
import pushPb from './push_pb'

/*================================================
| Array with current online players
*/
let onlinePlayers = [];
 
class SocketServer {
    memberId = 0
    key = ""
    ws = null
    fn = null
    //heartbeatInterval  = null
    constructor() {

    }
    getQuery (name){
        var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if(r!=null)return  unescape(r[2]); return null;
    }

    conn(fn){
        if (this.fn) {
            //return 
        }
        this.fn = fn  

        let self = this 
        let resp  = this.ajax({
            type:"GET",
            url:"http://127.0.0.1:14020/v2/ws/comet/GetToken",
            data:{id: this.getQuery("id") ? this.getQuery("id") :this.getRnd(1,100000)}
        })
        
        let item = resp.data
        self.key = item.nickname
        self.memberId = item.id
    
        let ws = new WebSocket( 'ws://127.0.0.1:14020/v2/ws?token=' +  item.token);
        self.ws = ws
        ws.binaryType = 'arraybuffer';
        ws.onopen         = () => {
            self.onopen()
            //self.heartbeatInterval = setInterval(self.heartbeat, 30 * 1000);
        };
        ws.onclose        = (e) => { self.onclose(e); }
        ws.onmessage     =  (e) => { self.onMessage(e);}
    }

    onopen( evt) {
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
        var bodydata = evt.data;
        var p = pushPb.Proto.deserializeBinary(bodydata)

        switch( p.getOp()) {
            case 3:
                break;
            case 9:
                break;
            case 29:
            let  offlineTmps  = pushPb.Offline.deserializeBinary(p.getBody())
            offlineTmps.getOpsList().forEach((v) => {
                let memberId = parseInt(v) 
                if (onlinePlayers[memberId]) delete onlinePlayers[memberId]
            })
            break
            case 41: // 处理发消息
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
                    this.fn({
                        event:'PLAYER_MOVED',
                        memberId:dst[0],
                        x: dst[1],
                        y:dst[2],
                        map:"town",
                    })
                })
                break
            default: 
             break
        } 
    }


    send(data) {
        if (data.event == "PLAYER_MOVED")  {
            let pb2 = new pushPb.Proto()
            pb2.setVer(1) 
            pb2.setOp(32)
            let posReqPb2 = new pushPb.PosReq()
            posReqPb2.addOps(parseInt(data.x),1)
            posReqPb2.addOps(parseInt(data.y),2)
            posReqPb2.addOps(1,3)  //朝向
            posReqPb2.addOps(0,4)   
            posReqPb2.addOps(0,5) 
            let tdata2= posReqPb2.serializeBinary()
            pb2.setBody(tdata2)
            let body = pb2.serializeBinary()
            this.ws.send(body)
            return
        }
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
            this.ws.send(body)
            return
        }
        
    }


        
    onclose(v) {
        //if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        let memberId = parseInt(this.memberId) 
        if (onlinePlayers[memberId]) delete onlinePlayers[memberId]
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
