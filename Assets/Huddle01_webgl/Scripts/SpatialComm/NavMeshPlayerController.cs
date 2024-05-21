using System;
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.UI;
using Huddle01;
using Object = UnityEngine.Object;

public class NavMeshPlayerController : MonoBehaviour
{

    private HuddleUserInfo _userInfo;
    public HuddleUserInfo UserInfo => _userInfo;


    [SerializeField]
    private NavMeshAgent _agent;

    public bool isLocalPlayer;

    [Header("Video Comp")]
    [SerializeField]
    private TMP_Text _nameText;
    [SerializeField]
    private RawImage _videoTexture;

    public Texture2D Texture { get; private set; }

    public bool isVideoPlaying = false;

    private int m_TextureId = 1;

    private bool _isSpatialComm = false;


    // Start is called before the first frame update
    void Start()
    {
        GetNewTextureId();
    }

    public void Setup(HuddleUserInfo userInfo)
    {
        _userInfo = userInfo;
    }

    // Update is called once per frame
    void Update()
    {
        if (isVideoPlaying)
        {
            SetupTexture();
        }

        if (_isSpatialComm) 
        {
            if (isLocalPlayer)
            {
                SetLocalPlayerPositionForSpatialComm(transform.position);
                SetLocalPlayerRotationForSpatialComm(transform.rotation);
            }
            else 
            {
                SetPositonForSpatialComm(_userInfo.PeerId, transform.position);
                SetRotationForSpatialComm(_userInfo.PeerId, transform.rotation);
            }
        }
    }

    public void MoveToPosition(Vector3 goalPos) 
    {
        _agent.destination = goalPos;
        if (isLocalPlayer) 
        {
            string posJson = JsonUtility.ToJson(goalPos);
            Huddle01Init.Instance.SendTextMessage(posJson);
        }
    }


    #region Video

    public void GetNewTextureId()
    {
        m_TextureId = JSNative.NewTexture();
    }

    public void SetupTexture()
    {
        if (Texture != null)
            Object.Destroy(Texture);
        Texture = Texture2D.CreateExternalTexture(1280, 720, TextureFormat.RGBA32, false, true, (IntPtr)m_TextureId);
        _videoTexture.texture = Texture;
    }

    public void AttachVideo()
    {
        JSNative.AttachVideo(_userInfo.PeerId, m_TextureId);
    }

    public void StopVideo()
    {
        isVideoPlaying = false;
        _videoTexture.gameObject.SetActive(false);
    }

    public void ResumeVideo()
    {
        _videoTexture.gameObject.SetActive(true);
        JSNative.AttachVideo(_userInfo.PeerId, m_TextureId);
        isVideoPlaying = true;
    }

    private void SetPositonForSpatialComm(string peerId,Vector3 pos) 
    {
        Huddle01Init.Instance.SetUpdatedPositionForSpatialComm(peerId, pos);
    }

    private void SetRotationForSpatialComm(string peerId, Quaternion rot) 
    {
        Huddle01Init.Instance.SetUpdatedRotationForSpatialComm(peerId, rot);
    }

    private void SetLocalPlayerPositionForSpatialComm(Vector3 pos) 
    {
        Huddle01Init.Instance.SetLocalPlayerUpdatedPositionForSpatialComm(pos);
    }

    private void SetLocalPlayerRotationForSpatialComm(Quaternion rot)
    {
        Huddle01Init.Instance.SetLocalPlayerUpdatedRotationForSpatialComm(rot);
    }

    #endregion

    #region

    public void MuteMic() 
    {
    
    }

    #endregion

    #region Metadata

    public void UpdateMetadata(PeerMetadata data) 
    {
    
    }

    #endregion


}
