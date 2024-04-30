using System;
using Newtonsoft.Json;
using UnityEngine;

[Serializable]
public class HuddleUserInfo
{
    public string PeerId;
    public PeerMetadata Metadata = new PeerMetadata();
    public bool IsRemotePeer;
    public string Role;
}

[System.Serializable]
public class PeerMetadata
{
    [JsonProperty("peerId")]
    public string PeerId;
    [JsonProperty("muteStatus")]
    public bool MuteStatus;
    [JsonProperty("name")]
    public string Name;
}

[System.Serializable]
public class JoinRoomResponse
{
    [JsonProperty("token")]
    public string Token;
    [JsonProperty("hostUrl")]
    public string HostUrl;
    [JsonProperty("redirectUrl")]
    public string RedirectUrl;

    public string ConvertToJSON()
    {
        return JsonUtility.ToJson(this);
    }

}


