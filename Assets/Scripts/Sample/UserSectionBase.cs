using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using System;
using Newtonsoft.Json;

namespace Huddle01.Sample
{
    public class UserSectionBase : MonoBehaviour
    {
        private HuddleUserInfo _userInfo;

        public HuddleUserInfo UserInfo => _userInfo;

        [SerializeField]
        private TMP_Text _nameText;

        [SerializeField]
        private GameObject _mutedIcon;

        [SerializeField]
        private GameObject _unmutedIcon;

        public void Setup(HuddleUserInfo userInfo)
        {
            _userInfo = userInfo;
            _mutedIcon.SetActive(true);
        }

        public void UpdateMetadata(PeerMetadata peerMetaData)
        {
            _userInfo.Metadata = peerMetaData;
            _nameText.text = _userInfo.Metadata.Name;
            SetMuteIcon(_userInfo.Metadata.MuteStatus);
        }

        private void SetMuteIcon(bool muted)
        {
            _mutedIcon.SetActive(muted);
            _unmutedIcon.SetActive(!muted);
        }
    }
}

