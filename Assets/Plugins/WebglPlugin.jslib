    var NativeLib = {
    
    huddleClient: null,
    room : null,
    huddleToken:null,
    localStream : null,
    

    // Video Receive
    NewTexture: function () {
        var tex = GLctx.createTexture();
        if (!tex){
            console.error("Failed to create a new texture for VideoReceiving")
            return LKBridge.NullPtr;
        }

        var id = GL.getNewId(GL.textures);
        tex.name = id;
        GL.textures[id] = tex;
        return id;
    },

    //Start Camera
    StartCamera: function(id)
    {
        createVideoElement(UTF8ToString(id));
    },

    InitHuddle01WebSdk:function(projectId)
    {
        huddleClient = new HuddleWebCore.HuddleClient({
                        projectId: UTF8ToString(projectId),
                        options: {
                            activeSpeakers: {
                            // Number of active speaker visible in the grid, by default 8
                            size: 10,
                            },
                        },
                    });

        huddleClient.localPeer.on('receive-data', function (data) {
            console.log(data);
            SendMessage("Huddle01Init", "MessageReceived",JSON.stringify(data));
        });

        //for testing only getting value of token from url
        var params = new URLSearchParams(document.location.search);
        huddleToken = params.get("token");
        console.log("Token",huddleToken);
    },


    JoinRoom : async function(roomId,tokenVal)
    {
        console.log("Join Room");
        //join room
        room = await huddleClient.joinRoom({
                roomId: UTF8ToString(roomId),
                token: huddleToken,
                });


        // on join room event
        room.on("room-joined", async function () {

            console.log("Room ID:", room.roomId);
            const remotePeers = huddleClient.room.remotePeers
            SendMessage("Huddle01Init", "OnRoomJoined"); 
            
            //if peer already exists
            for (var entry of Array.from(remotePeers.entries())) {
                var key = entry[0];
                var value = entry[1];
                var tempRemotePeer = value;

                console.log("remote peer : ",tempRemotePeer);

                SendMessage("Huddle01Init", "OnPeerAdded",tempRemotePeer.peerId);
                
                // remote peer on metadata updated event
                tempRemotePeer.on("metadata-updated", async function () {
                var updatedMetadata = await huddleClient.room.getRemotePeerById(tempRemotePeer.peerId).getMetadata();
                SendMessage("Huddle01Init", "OnPeerMetadataUpdated",JSON.stringify(updatedMetadata));
                
                });
                
                tempRemotePeer.on("stream-available", async function(data) {
                    console.log("stream-available : ",data);
                    const audioElem = document.createElement("audio");
                    audioElem.id = tempRemotePeer.peerId;

                    if(!data.consumer.track)
                    {
                        return console.log("track not found");    
                    }
                    const stream  = new MediaStream([data.consumer.track]);

                    audioElem.srcObject = stream;
                    audioElem.play();

                });

                // remote peer on stream available event
                tempRemotePeer.on("stream-playable", async function(data) {
                    console.log("stream-playable : ",data);
                    if(data.label == "audio")
                    {
                        const audioElem = document.createElement("audio");
                        audioElem.id = tempRemotePeer.peerId + "_audio";

                        if(!data.consumer.track)
                        {
                            return console.log("track not found");    
                        }
                        
                        const stream  = new MediaStream([data.consumer.track]);
                        console.log("Stream  : ",stream);
                        audioElem.srcObject = stream;
                        audioElem.play();

                    }else if(data.label == "video")
                    {   
                        if(!data.consumer.track)
                        {
                            return console.log("track not found");    
                        }

                        var videoElem = document.createElement("video");
                        videoElem.id = tempRemotePeer.peerId + "_video";
                        console.log("video created : ",videoElem.id);
                        document.body.appendChild(videoElem);

                        const videoStream  = new MediaStream([data.consumer.track]);
                        videoElem.srcObject = videoStream;
                        videoElem.play();
                        SendMessage("Huddle01Init", "ResumeVideo",tempRemotePeer.peerId);
                    }

                });
                
                // remote peer on stream closed event
                tempRemotePeer.on("stream-closed", function (data) {
                    
                    if(data.label == "audio")
                    {
                        var audioElem = document.getElementById(tempRemotePeer.peerId+"_audio");
                        if(audioElem)
                        {
                            audioElem.srcObject = null;
                            audioElem.remove();
                        }

                        SendMessage("Huddle01Init", "OnPeerMute",tempRemotePeer.peerId)

                    }else if(data.label == "video")
                    {
                        var videoElem = document.getElementById(tempRemotePeer.peerId + "_video");

                        if(videoElem)
                        {
                            videoElem.remove();
                        }

                        SendMessage("Huddle01Init", "StopVideo",tempRemotePeer.peerId)

                    }
                });

                //metadata already exist
                var updatedMetadata = await huddleClient.room.getRemotePeerById(tempRemotePeer.peerId).getMetadata();
                SendMessage("Huddle01Init", "OnPeerMetadataUpdated",JSON.stringify(updatedMetadata));
            }
        });

        
        //room-closed event
        room.on("room-closed", function () {
            console.log("Peer ID:", data.peerId);
            SendMessage("Huddle01Init", "OnRoomClosed");     
        });

        //new-peer-joined event
        huddleClient.room.on("new-peer-joined", function (data) {
        console.log("new-peer-joined Peer ID:", data.peer);
        SendMessage("Huddle01Init", "OnPeerAdded",data.peer.peerId);
       
        //Add audio tag
        
        var remotePeer = data.peer;

        remotePeer.on("metadata-updated", async function () {
            console.log("Successfully updated remote peer metadata of : ", remotePeer.peerId);
            var updatedMetadata = await huddleClient.room.getRemotePeerById(remotePeer.peerId).getMetadata();
            SendMessage("Huddle01Init", "OnPeerMetadataUpdated",JSON.stringify(updatedMetadata));

        });
        
        remotePeer.on("stream-playable", async function(data) {

            console.log("stream-playable : ",data);
            if(data.label == "audio")
            {
                const audioElem = document.createElement("audio");
                audioElem.id = remotePeer.peerId + "_audio";

                if(!data.consumer.track)
                {
                    return console.log("track not found");    
                }
                
                const stream  = new MediaStream([data.consumer.track]);
                console.log("Stream  : ",stream);
                audioElem.srcObject = stream;
                audioElem.play();

            }else if(data.label == "video")
            {
                var videoElem = document.createElement("video");
                videoElem.id = remotePeer.peerId + "_video";
                console.log("video created : ",videoElem.id);
                document.body.appendChild(videoElem);
                const videoStream  = new MediaStream([data.consumer.track]);
                videoElem.srcObject = videoStream;
                videoElem.play();
                SendMessage("Huddle01Init", "ResumeVideo",remotePeer.peerId);
            }
        });
        
        remotePeer.on("stream-closed", function (data) {
            console.log("Remote Peer Stream is closed.",data);

            if(data.label == "audio")
            {
                    var audioElem = document.getElementById(remotePeer.peerId+"_audio");
                    if(audioElem)
                    {
                        audioElem.srcObject = null;
                        audioElem.remove();
                    }

                    SendMessage("Huddle01Init", "OnPeerMute",remotePeer.peerId)

            }else if(data.label == "video")
            {
                var videoElem = document.getElementById(remotePeer.peerId + "_video");

                if(videoElem)
                {
                    videoElem.remove();
                }

                SendMessage("Huddle01Init", "StopVideo",remotePeer.peerId)

            }
        });
        
        });

        //peer-left
        room.on("peer-left", function (peerId) {
            console.log(" peer-left Peer ID:", peerId);
            //remove audio element
            var audioElem = document.getElementById(peerId+"_audio");

            if(!audioElem)
            {
                audioElem.srcObject = null;
                audioElem.remove();
            }

            //remove video element
            var videoElem = document.getElementById(peerId + "_video");

            if(!videoElem)
            {
                videoElem.remove();
            }

            // delete associated 
            SendMessage("Huddle01Init", "OnPeerLeft",peerId);     
        });

    },


    MuteMic : async function(shouldMute,metadataNativ)
    {
        var metadata = JSON.parse(UTF8ToString(metadataNativ));
        console.log("MuteMic metadata name val : ",UTF8ToString(metadataNativ));

        if(shouldMute)
        {
            await huddleClient.localPeer.disableAudio();
            
        }else
        {
            await huddleClient.localPeer.enableAudio();
        }

        huddleClient.localPeer.updateMetadata({ 
            peerId: metadata.peerId,
            muteStatus: metadata.muteStatus,
            videoStatus : metadata.videoStatus,
            name : metadata.name
        });

    },

    EnableVideo : async function(enableVideo,metadataNativ)
    {
        var metadata = JSON.parse(UTF8ToString(metadataNativ));
        console.log("EnableVideo metadata name val : ",UTF8ToString(metadataNativ));
        
        if(enableVideo)
        {
            //const producer = await huddleClient.localPeer.produce({ label: "video", stream: mediaStream, appData });
            localStream = await huddleClient.localPeer.enableVideo();

            var videoElem = document.createElement("video");
            videoElem.id = huddleClient.localPeer.peerId + "_video";
            console.log("video created : ",videoElem.id);
            document.body.appendChild(videoElem);

            videoElem.srcObject = localStream;
            videoElem.play();

            SendMessage("Huddle01Init", "ResumeVideo",huddleClient.localPeer.peerId);
        }else
        {
            await huddleClient.localPeer.disableVideo();

            var videoElem = document.getElementById(huddleClient.localPeer.peerId + "_video");

            if(videoElem)
            {
                videoElem.remove();
            }

            SendMessage("Huddle01Init", "StopVideo",huddleClient.localPeer.peerId);
        }

        huddleClient.localPeer.updateMetadata({ 
            peerId: metadata.peerId,
            muteStatus: metadata.muteStatus,
            videoStatus : metadata.videoStatus,
            name : metadata.name
        });
    },
    
    LeaveRoom : function()
    {
       huddleClient.leaveRoom();
    },

    SendTextMessage : function(message)
    {
        var mes = UTF8ToString(message);
        console.log("Sending message",mes);
        huddleClient.localPeer.sendData({ to: "*", payload: mes, label: 'chat' });
    },

    ConsumePeer : function(peerId)
    {
        
    },

    UpdatePeerMeataData : function(metadataVal)
    {
        var metadata = JSON.parse(UTF8ToString(metadataVal));
        huddleClient.localPeer.updateMetadata({ 
            peerId: metadata.peerId,
            muteStatus: metadata.muteStatus,
            name : metadata.name
        });
    },

    GetRemotePeerMetaData : function(peerId)
    {
        console.log("GetRemotePeerMetaData : " );
        var remotePeer = huddleClient.room.getRemotePeerById(UTF8ToString(peerId)).getMetadata();
        console.log("remote Peer Metadata : " ,remotePeer );
        return stringToUTF8(JSON.stringify(remotePeer));
    },

    GetLocalPeerId : async function()
    {
        var peerId = await huddleClient.localPeer.peerId;
        SendMessage("Huddle01Init", "OnLocalPeerIdReceived",peerId);
    },

    AttachVideo: function (peerId, texId) {
        var tex = GL.textures[texId];
        var lastTime = -1;
        var peerIdString = UTF8ToString(peerId);
        console.log("video id " + UTF8ToString(peerId) + "_video");
        var initialVideo = document.getElementById(UTF8ToString(peerId) + "_video");
        initialVideo.style.opacity = 0;
        initialVideo.style.width = 0;
        initialVideo.style.height = 0;
        setTimeout(function() {
            initialVideo.play();
        }, 0)
        initialVideo.addEventListener("canplay", (event) => {
            initialVideo.play();
        });
 
        //document.body.appendChild(initialVideo);
        var updateVideo = function (peerIdVal,textureId) {
            
            var video = document.getElementById(peerIdVal + "_video");

            if (!video || video === undefined) {
                initialVideo.remove();
                return;
            }
            
            if (!video.paused) {
                
                GLctx.bindTexture(GLctx.TEXTURE_2D, tex);
                
                // Flip Y
                GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, true);
                GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, video);
                GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, false);

                GLctx.texParameteri(GLctx.TEXTURE_2D, GLctx.TEXTURE_MAG_FILTER, GLctx.LINEAR);
                GLctx.texParameteri(GLctx.TEXTURE_2D, GLctx.TEXTURE_MIN_FILTER, GLctx.LINEAR);
                GLctx.texParameteri(GLctx.TEXTURE_2D, GLctx.TEXTURE_WRAP_S, GLctx.CLAMP_TO_EDGE);
                GLctx.texParameteri(GLctx.TEXTURE_2D, GLctx.TEXTURE_WRAP_T, GLctx.CLAMP_TO_EDGE);
            }
            
            requestAnimationFrame(function(){updateVideo(peerIdVal,textureId)});
        };
        
        requestAnimationFrame(function(){updateVideo(peerIdString,tex)});
    },
};

mergeInto(LibraryManager.library, NativeLib);

