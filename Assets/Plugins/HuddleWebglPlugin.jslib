    var NativeLib = {
    
    huddleClient: null,
    room : null,
    huddleToken:null,
    localStream : null,
    audioContext : null,
    audioListener : null,
    soundObjects : null,
    SpatialCoomCapability : null,
    peersMap : null,
    

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

        peersMap = new Map();

        //for testing only getting value of token from url
        //var params = new URLSearchParams(document.location.search);
        //huddleToken = params.get("token");
        //console.log("Token",huddleToken);
    },

    SetUpForSpatialCommForPeer : function(peerId)
    {
        var peerIdString = UTF8ToString(peerId);
        var audioElem = document.getElementById(peerIdString+"_audio");

        if(!audioElem)
        {
            return console.error("audio element not found");
        }

        if(!peersMap[peerIdString].audioStream)
        {
            return console.error("audio stream not found");
        }

        audioElem.pause();

        const track = audioContext.createMediaStreamSource(peersMap[peerIdString].audioStream);
        //const track = CreateMediaElementSource(audioContext,audioElem);
        var panner = audioContext.createPanner();
        panner.positionX.setValueAtTime(1000, 0);
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'exponential';
        panner.refDistance = 1;
        panner.maxDistance = 10;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 360;
        panner.coneOuterGain = 0;

        track.connect(panner).connect(audioContext.destination);

        audioElem.srcObject = peersMap[peerIdString].audioStream;
        audioElem.play();

        soundObjects[peerIdString] = { source: track, panner: panner };

        console.log("Spatial comm setup for peer",peerIdString);
    },

    DisconnectPeerPanner: function(peerId)
    {
        if (soundObjects[UTF8ToString(peerId)]) 
        {
            //get panner
            var panner = soundObjects[UTF8ToString(peerId)].panner;
            //disconnect
            panner.disconnect();
            soundObjects.delete(UTF8ToString(peerId));
        }
    },

    SetUpForSpatialComm:function()
    {
        console.log("Init Spatial Comm");
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioListener = audioContext.listener;
        audioListener.setPosition(0, 0, 0);
        soundObjects = new Map();
        SpatialCoomCapability = true;
        console.log("spatial comm is setup for local peer");
    },

    UpdateListenerPosition:function(posX,posY,posZ)
    {
        audioListener.setPosition(posX,posY,posZ);
    },

    UpdateListenerRotation:function(rotX,rotY,rotZ)
    {
        audioListener.forwardX.value = rotX;
        audioListener.forwardY.value = rotY;
        audioListener.forwardZ.value = rotZ;

        audioListener.upX.value = 0;
        audioListener.upY.value = 1;
        audioListener.upZ.value = 0;
    },

    UpdatePeerPosition:function(peerId,posX,posY,posZ)
    {   
        if (soundObjects[UTF8ToString(peerId)]) 
        {
            //get panner
            var tempPanner = soundObjects[UTF8ToString(peerId)].panner;
            tempPanner.setPosition(posX, posY, posZ);
        }
    },

    UpdatePeerRotation:function(peerId,rotX,rotY,rotZ)
    {
        if (soundObjects[UTF8ToString(peerId)]) 
        {
            //get panner
            var tempPanner = soundObjects[UTF8ToString(peerId)].panner;
            tempPanner.setOrientation(rotX, rotY, rotZ);
        }
    },


    JoinRoom : async function(roomId,tokenVal)
    {
        console.log("Join Room");
        //join room
        room = await huddleClient.joinRoom({
                roomId: UTF8ToString(roomId),
                token: UTF8ToString(tokenVal),
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

                peersMap[tempRemotePeer.peerId] = { audioStream: null, videoStream:null };

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
                    audioElem.id = tempRemotePeer.peerId + "_audio";

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
                        //audioElem.srcObject = stream;
                        document.body.appendChild(audioElem);
                        //audioElem.play();
                        
                        if(peersMap[tempRemotePeer.peerId])
                        {
                            peersMap[tempRemotePeer.peerId].audioStream = stream;
                        }

                        SendMessage("Huddle01Init", "OnPeerUnMute",tempRemotePeer.peerId);

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
                        console.log("audio on audio close",audioElem);
                        if(audioElem)
                        {
                            audioElem.srcObject = null;
                            audioElem.remove();
                        }

                        if(peersMap[tempRemotePeer.peerId])
                        {
                            peersMap[tempRemotePeer.peerId].audioStream = null;
                        }

                        SendMessage("Huddle01Init", "OnPeerMute",tempRemotePeer.peerId);

                    }else if(data.label == "video")
                    {
                        var videoElem = document.getElementById(tempRemotePeer.peerId + "_video");

                        if(videoElem)
                        {
                            videoElem.remove();
                        }

                        SendMessage("Huddle01Init", "StopVideo",tempRemotePeer.peerId);

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
            
            peersMap[data.peer.peerId] = { audioStream: null, videoStream:null };
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
                //audioElem.srcObject = stream;
                document.body.appendChild(audioElem);
                //audioElem.play();
                if(peersMap[remotePeer.peerId])
                {
                    peersMap[remotePeer.peerId].audioStream = stream;
                }
                SendMessage("Huddle01Init", "OnPeerUnMute",remotePeer.peerId);

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
                console.log("audio on audio close",audioElem);
                if(audioElem)
                {
                    audioElem.srcObject = null;
                    audioElem.remove();
                }

                if(peersMap[remotePeer.peerId])
                {
                    peersMap[remotePeer.peerId].audioStream = null;
                }

                SendMessage("Huddle01Init", "OnPeerMute",remotePeer.peerId);

            }else if(data.label == "video")
            {
                var videoElem = document.getElementById(remotePeer.peerId + "_video");

                if(videoElem)
                {
                    videoElem.remove();
                }

                SendMessage("Huddle01Init", "StopVideo",remotePeer.peerId);

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
            peersMap.delete(UTF8ToString(peerId));
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
            name : metadata.name,
            videoStatus: metadata.videoStatus
        });
    },

    GetRemotePeerMetaData : function(peerId)
    {
        console.log("GetRemotePeerMetaData : " );
        var remotePeer = huddleClient.room.getRemotePeerById(UTF8ToString(peerId)).getMetadata();
        console.log("remote Peer Metadata : " ,remotePeer );

        var bufferSize = lengthBytesUTF8(JSON.stringify(remotePeer)) + 1;
        var buffer = _malloc(bufferSize);
        stringToUTF8(JSON.stringify(remotePeer), buffer, bufferSize);
        return buffer;
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

