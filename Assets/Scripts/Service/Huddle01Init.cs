using AOT;
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;
using Huddle01.Services;

namespace Huddle01 
{
    public class Huddle01Init : Singleton<Huddle01Init>
    {
        public delegate void LocalPeerIdEventHandler(string peerId);
        public delegate void PeerAddedEventHandler(string peerInfo);
        public delegate void PeerLeftEventHandler(string peerInfo);
        public delegate void PeerMutedEventHandler(string peerInfo);
        public delegate void RoomClosedEventHandler();
        public delegate void PeerMetadataUpdatedEventHandler(PeerMetadata peerMetadata);
        public delegate void JoinRoomEventHandler();

        public static event LocalPeerIdEventHandler LocalPeerId;
        public static event PeerAddedEventHandler PeerAdded;
        public static event PeerLeftEventHandler PeerLeft;
        public static event PeerMutedEventHandler PeerMuted;
        public static event RoomClosedEventHandler RoomClosed;
        public static event PeerMetadataUpdatedEventHandler PeerMetadata;
        public static event JoinRoomEventHandler OnJoinRoom;

        private string _projectId;
        private string _roomId;
        private string _token;

        public string RoomId => _roomId;
        public string Token => _token;

        public void Init(string projectId)
        {
            _projectId = projectId;
            JSNative.InitHuddle01WebSdk(_projectId);
        }

        public void JoinRoom(string roomId, string token)
        {
            _roomId = roomId;
            _token = token;
            JSNative.JoinRoom(_roomId, _token);
        }

        public void LeaveRoom()
        {
            JSNative.LeaveRoom();
        }

        public void MuteMic(bool shouldMute, PeerMetadata metadata)
        {
            Debug.Log($"Mute mic : {JsonConvert.SerializeObject(metadata)}");
            JSNative.MuteMic(shouldMute, JsonConvert.SerializeObject(metadata));
        }

        public void SendTextMessage(string message)
        {
            JSNative.SendTextMessage(message);
        }

        public void ConsumerPeer(string peerId)
        {
            JSNative.ConsumePeer(peerId);
        }

        public void GetLocalPeerId()
        {
            JSNative.GetLocalPeerId();
        }

        public void UpdateLocalPeerMetaData(string metadata)
        {
            JSNative.UpdatePeerMeataData(metadata);
        }


        #region Callbacks

        public void OnRoomJoined()
        {
            Debug.Log("Room Joined");
            OnJoinRoom?.Invoke();
        }

        public void OnLocalPeerIdReceived(string peerId)
        {
            Debug.Log($"OnLocalPeerIdReceived {peerId}");
            LocalPeerId?.Invoke(peerId);
        }

        public void OnPeerAdded(string peerInfo)
        {
            Debug.Log($"OnPeerAdded {peerInfo}");
            PeerAdded?.Invoke(peerInfo);
        }

        public void OnPeerLeft(string peerInfo)
        {
            Debug.Log($"OnPeerLeft {peerInfo}");
            PeerLeft?.Invoke(peerInfo);
        }

        public void OnPeerMute(string peerInfo)
        {
            Debug.Log($"OnPeerMute {peerInfo}");
            PeerMuted?.Invoke(peerInfo);
        }

        public void OnRoomClosed()
        {
            Debug.Log($"OnRoomClosed");
            RoomClosed?.Invoke();
        }

        public void OnPeerMetadataUpdated(string peerInfo)
        {
            Debug.Log($"peerInfo {peerInfo}");
            PeerMetadata response = JsonConvert.DeserializeObject<PeerMetadata>(peerInfo);
            PeerMetadata?.Invoke(response);
        }

        #endregion
    }
}

