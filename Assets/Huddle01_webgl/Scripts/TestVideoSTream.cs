using AOT;
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using Object = UnityEngine.Object;

namespace Huddle 
{
    public class TestVideoSTream : MonoBehaviour
    {
        public delegate void PeerAddedEventHandler(string peerInfo);
        public delegate void PeerLeftEventHandler(string peerInfo);
        public delegate void PeerMutedEventHandler(string peerInfo, bool muted);

        public static event PeerAddedEventHandler PeerAdded;
        public static event PeerLeftEventHandler PeerLeft;
        public static event PeerMutedEventHandler PeerMuted;

        public string RoomID;
        public string Token;

        [SerializeField]
        private RawImage _videoTexture;

        public Texture2D Texture { get; private set; }
        private int m_TextureId;
        private const string nativeHandle = "123";

        public string appId;

        private bool isTextureSetup=false;

        private void Start()
        {
            //JSNative.InitHuddle01WebSdk(appId);
            //JSNative.RegisterCallbacks(OnRoomJoined, OnPeerAdded, OnPeerLeft, OnPeerMuted);
        }

        public void StartVideoStreaming() 
        {
            //m_TextureId = JSNative.NewTexture();
            //JSNative.StartCamera(nativeHandle);
            //JSNative.AttachVideo(nativeHandle, m_TextureId);
            isTextureSetup = true;
        }

        private void Update()
        {
            if (isTextureSetup) 
            {
                SetupTexture();
            }
        }

        void SetupTexture()
        {
            if (Texture != null)
                Object.Destroy(Texture);
            Texture = Texture2D.CreateExternalTexture(1280, 720, TextureFormat.RGBA32, false, true, (IntPtr)m_TextureId);
            _videoTexture.texture = Texture;
        }

        public void InitHuddle01() 
        {
            //JSNative.InitHuddle01WebSdk("{}");
        }

        public void JoinRoom() 
        {
            //JSNative.JoinRoom(RoomID,Token);
        }

    }
}


