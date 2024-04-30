    var NativeLib = {
    
    huddleClient: null,
    room : null,
    huddleToken:null,
    

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

                    //audioElem.srcObject = stream;
                    //audioElem.play();

                });

                // remote peer on stream available event
                tempRemotePeer.on("stream-playable", async function(data) {
                    console.log("stream-playable : ",data);
                    const audioElem = document.createElement("audio");
                    audioElem.id = tempRemotePeer.peerId;

                    if(!data.consumer.track)
                    {
                        return console.log("track not found");    
                    }
                    const stream  = new MediaStream([data.consumer.track]);
                    console.log("Stream  : ",stream);
                    audioElem.srcObject = stream;
                    audioElem.play();

                });
                
                // remote peer on stream closed event
                tempRemotePeer.off("stream-closed", function () {
                    
                    const audioElem = document.getElementById(tempRemotePeer.peerId);

                    audioElem.srcObject = null;
                    audioElem.remove();
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
        
        remotePeer.on("stream-available", async function(data) {
            console.log("stream-available : ",data);
            const audioElem = document.createElement("audio");
            audioElem.id = remotePeer.peerId;

            if(!data.consumer.track)
            {
                return console.log("track not found");    
            }
            const stream  = new MediaStream([data.consumer.track]);

            //audioElem.srcObject = stream;
            //audioElem.play();
        });

        remotePeer.on("stream-playable", async function(data) {
            console.log("stream-playable : ",data);
            const audioElem = document.createElement("audio");
            audioElem.id = remotePeer.peerId;

            if(!data.consumer.track)
            {
                return console.log("track not found");    
            }
            
            const stream  = new MediaStream([data.consumer.track]);
            console.log("Stream  : ",stream);
            audioElem.srcObject = stream;
            audioElem.play();
        });
        
        remotePeer.off("stream-closed", function () {
            console.log("Remote Peer Stream is closed.");
        });
        
        });

        //peer-left
        room.on("peer-left", function (peerId) {
            console.log(" peer-left Peer ID:", peerId);

            var audioElem = document.getElementById(peerId);

            if(!audio)
            {
                audioElem.srcObject = null;
                audioElem.remove();
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
            name : metadata.name
        });

    },
    
    LeaveRoom : function()
    {
       huddleClient.leaveRoom();
    },

    SendTextMessage : function(message)
    {
        huddleClient.localPeer.sendData({ to: "*", payload: message, label: 'chat' });
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

    AttachVideo: function (id, texId) {
        var tex = GL.textures[texId];
        var lastTime = -1;
        console.log("video id " + UTF8ToString(id));
        var initialVideo = getVideoElement(UTF8ToString(id));
        initialVideo.style.opacity = 0;
        initialVideo.style.width = 0;
        initialVideo.style.height = 0;
        setTimeout(function() {
            initialVideo.play();
        }, 0)
        initialVideo.addEventListener("canplay", (event) => {
            initialVideo.play();
        });
 
        document.body.appendChild(initialVideo);
        var updateVideo = function () {
            var video = getVideoElement(id);
            if (video === undefined) {
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
            
            requestAnimationFrame(updateVideo);
        };
        
        requestAnimationFrame(updateVideo);
    },
};

mergeInto(LibraryManager.library, NativeLib);

