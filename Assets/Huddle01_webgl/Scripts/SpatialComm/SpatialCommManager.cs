using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Huddle01;
using TMPro;
using Newtonsoft.Json;
using System;

public class SpatialCommManager : MonoBehaviour
{
    public Dictionary<string, GameObject> PeersMap = new Dictionary<string, GameObject>();

    [HideInInspector]
    public GameObject LocalPlayer;

    [SerializeField]
    private string _projectId;
    [SerializeField]
    private string _apiKey;

    [Header("Player prrfab")]
    [SerializeField]
    private GameObject _playerPrefab;

    [Header("Menu Section")]
    [SerializeField]
    private GameObject _menuPanel;
    [SerializeField]
    private TMP_InputField _roomId;
    [SerializeField]
    private TMP_InputField _token;
    [SerializeField]
    private TMP_InputField _nameInputFeild;

    [Header("Header")]
    [SerializeField]
    private TMP_Text _headerText;

    // Start is called before the first frame update
    void Start()
    {
        _headerText.text = $"RoomID : {_roomId}";
        Huddle01Init.Instance.Init(_projectId);
    }



    private void OnEnable()
    {
        Huddle01Init.OnJoinRoom += OnJoinRoom;
        Huddle01Init.LocalPeerId += OnLocalPeerIdReceived;
        Huddle01Init.PeerAdded += OnPeerJoined;
        Huddle01Init.PeerLeft += OnPeerLeft;
        Huddle01Init.RoomClosed += OnRoomClosed;
        Huddle01Init.PeerMetadata += OnPeerMetaDataUpdated;
        Huddle01Init.OnResumePeerVideo += OnPeerVideoResume;
        Huddle01Init.OnStopPeerVideo += OnPeerVideoStop;
        Huddle01Init.OnMessageReceived += OnMessageReceived;
    }

    private void OnDisable()
    {
        Huddle01Init.OnJoinRoom -= OnJoinRoom;
        Huddle01Init.LocalPeerId -= OnLocalPeerIdReceived;
        Huddle01Init.PeerAdded -= OnPeerJoined;
        Huddle01Init.PeerLeft -= OnPeerLeft;
        Huddle01Init.RoomClosed -= OnRoomClosed;
        Huddle01Init.PeerMetadata -= OnPeerMetaDataUpdated;
        Huddle01Init.OnResumePeerVideo -= OnPeerVideoResume;
        Huddle01Init.OnStopPeerVideo -= OnPeerVideoStop;
        Huddle01Init.OnMessageReceived -= OnMessageReceived;
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    #region Callbacks

    private void OnRoomClosed()
    {
        foreach (var item in PeersMap)
        {
            Destroy(item.Value);
        }

        PeersMap.Clear();

        Destroy(LocalPlayer);
    }

    private void OnPeerLeft(string peerInfo)
    {
        Debug.Log($"OnPeerLeft : {peerInfo}");
        GameObject temp = null;
        if (PeersMap.TryGetValue(peerInfo, out temp))
        {
            Debug.Log($"OnPeerLeft : {temp.name}");
            PeersMap.Remove(peerInfo);
            Destroy(temp);
        }
    }

    private void OnPeerJoined(string peerId)
    {
        Debug.Log($"Peer Joined : {peerId}");
        GameObject peerSection = Instantiate(_playerPrefab);
        peerSection.transform.position = Vector3.zero;
        NavMeshPlayerController userSectionRef = peerSection.GetComponent<NavMeshPlayerController>();
        Debug.Log($"Adding peer to map : {peerId}");
        PeersMap.Add(peerId, peerSection);
        HuddleUserInfo userInfo = new HuddleUserInfo();
        userInfo.PeerId = peerId;
        userSectionRef.Setup(userInfo);
        userSectionRef.UpdateMetadata(JsonConvert.DeserializeObject<PeerMetadata>(JSNative.GetRemotePeerMetaData(peerId)));
    }

    private void OnJoinRoom()
    {
        _headerText.text = $"Room Joined";

        LocalPlayer = Instantiate(_playerPrefab);
        LocalPlayer.transform.position = Vector3.zero;
        NavMeshPlayerController playerController = LocalPlayer.GetComponent<NavMeshPlayerController>();
        playerController.isLocalPlayer = true;
        HuddleUserInfo selfUserInfo = new HuddleUserInfo();
        selfUserInfo.IsRemotePeer = false;
        selfUserInfo.Role = "guest";
        playerController.Setup(selfUserInfo);

        _menuPanel.SetActive(false);

        Huddle01Init.Instance.GetLocalPeerId();
    }

    private void OnLocalPeerIdReceived(string peerId)
    {
        NavMeshPlayerController localPlayerTemp = LocalPlayer.GetComponent<NavMeshPlayerController>();
        localPlayerTemp.UserInfo.PeerId = peerId;
        if (string.IsNullOrEmpty(_nameInputFeild.text))
        {
            _nameInputFeild.text = "Guest";
        }
        localPlayerTemp.UserInfo.Metadata.Name = _nameInputFeild.text;
        localPlayerTemp.UserInfo.Metadata.MuteStatus = false;
        localPlayerTemp.UserInfo.Metadata.VideoStatus = false;
        localPlayerTemp.UserInfo.Metadata.PeerId = peerId;
        UpdateLocalPeerMetaData(localPlayerTemp.UserInfo.Metadata);
        localPlayerTemp.UpdateMetadata(localPlayerTemp.UserInfo.Metadata);
        localPlayerTemp.MuteMic();
    }

    private void OnPeerMetaDataUpdated(PeerMetadata peerInfo)
    {
        if (LocalPlayer.GetComponent<NavMeshPlayerController>().UserInfo.PeerId == peerInfo.PeerId)
        {
            return;
        }

        //check for other peer
        GameObject peerSection = null;
        Debug.Log($"OnPeerMetaDataUpdated : {peerInfo.PeerId}");

        if (PeersMap.TryGetValue(peerInfo.PeerId, out peerSection))
        {
            Debug.Log($"OnPeerMetaDataUpdated : {peerSection.name}");
            peerSection.GetComponent<NavMeshPlayerController>().UpdateMetadata(peerInfo);
        }
        else
        {
            Debug.LogError("Peer not found");
        }
    }

    private void OnPeerVideoStop(string peerId)
    {
        NavMeshPlayerController localPlayerTemp = LocalPlayer.GetComponent<NavMeshPlayerController>();
        if (localPlayerTemp.UserInfo.PeerId == peerId)
        {
            localPlayerTemp.StopVideo();
            return;
        }

        GameObject peerSection = null;
        Debug.Log($"OnPeerVideoStop : {peerId}");

        if (PeersMap.TryGetValue(peerId, out peerSection))
        {
            Debug.Log($"OnPeerMetaDataUpdated : {peerSection.name}");
            peerSection.GetComponent<NavMeshPlayerController>().StopVideo();
        }
        else
        {
            Debug.LogError("Peer not found");
        }
    }

    private void OnPeerVideoResume(string peerId)
    {
        NavMeshPlayerController localPlayerTemp = LocalPlayer.GetComponent<NavMeshPlayerController>();
        if (localPlayerTemp.UserInfo.PeerId == peerId)
        {
            localPlayerTemp.ResumeVideo();
            return;
        }

        GameObject peerSection = null;
        Debug.Log($"OnPeerVideoStop : {peerId}");

        if (PeersMap.TryGetValue(peerId, out peerSection))
        {
            Debug.Log($"OnPeerMetaDataUpdated : {peerSection.name}");
            peerSection.GetComponent<NavMeshPlayerController>().ResumeVideo();
        }
        else
        {
            Debug.LogError("Peer not found");
        }
    }


    private void OnMessageReceived(string data)
    {
        Debug.Log($"received data : {data}");
        //extract peerID and position
        //Move to position
    }

    #endregion

    #region Public function

    public void UpdateLocalPeerMetaData(PeerMetadata peerMetadata)
    {
        Debug.Log($"UpdateLocalPeerMetaData : {JsonConvert.SerializeObject(peerMetadata)}");
        Huddle01Init.Instance.UpdateLocalPeerMetaData(JsonConvert.SerializeObject(peerMetadata));
    }

    #endregion

}
