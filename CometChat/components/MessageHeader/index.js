import React from "react";
import dateFormat from "dateformat";
/** @jsx jsx */
import { jsx } from '@emotion/core'

import { MessageHeaderManager } from "./controller";

import StatusIndicator from "../StatusIndicator";
import Avatar from "../Avatar";
import { SvgAvatar } from '../../util/svgavatar';

import * as enums from '../../util/enums.js';

import { 
  chatHeaderStyle, 
  chatDetailStyle, 
  chatSideBarBtnStyle, 
  chatThumbnailStyle,
  chatUserStyle,
  chatNameStyle,
  chatStatusStyle,
  chatOptionWrapStyle,
  chatOptionStyle
} from "./style";

import menuIcon from './resources/menuicon.png';
import audioCallIcon from './resources/audiocall.png';
import videoCallIcon from './resources/videocall.png';
import detailPaneIcon from './resources/detailpane.png';

class MessageHeader extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      status: "",
      presence: "offline",
    }
  }

  componentDidMount() {

    this.MessageHeaderManager = new MessageHeaderManager();
    this.MessageHeaderManager.attachListeners(this.updateHeader);

    if(this.props.type === "user") {
      this.setStatusForUser();
    } else {
      this.setStatusForGroup();
    }
  }

  componentDidUpdate(prevProps, prevState) {

    this.MessageHeaderManager.removeListeners();
    this.MessageHeaderManager = new MessageHeaderManager();
    this.MessageHeaderManager.attachListeners(this.updateHeader);

    if (this.props.type === 'user' && prevProps.item.uid !== this.props.item.uid) {
      this.setStatusForUser();
    } else if (this.props.type === 'group' 
    && (prevProps.item.guid !== this.props.item.guid 
      || (prevProps.item.guid === this.props.item.guid && prevProps.item.membersCount !== this.props.item.membersCount)) ) {
      this.setStatusForGroup();
    }
  }

  setStatusForUser = () => {

    let status = this.props.item.status;
    const presence = (this.props.item.status === "online") ? "online" : "offline";

    if(this.props.item.status === "offline" && this.props.item.lastActiveAt) {

      const lastActive = (this.props.item.lastActiveAt * 1000);
      const messageDate = dateFormat(lastActive, "d mmmm yyyy, h:MM TT");

      status = "Last active at: " + messageDate;
    } else if(this.props.item.status === "offline") {
      status = "offline";
    }

    this.setState({status: status, presence: presence});
  }

  setStatusForGroup = () => {

    const status = `${this.props.item.membersCount} members`;
    this.setState({status: status});
  }

  componentWillUnmount() {

    this.MessageHeaderManager.removeListeners();
    this.MessageHeaderManager = null;
  }

  updateHeader = (key, item, groupUser) => {
    
    switch(key) {

      case enums.USER_ONLINE:
      case enums.USER_OFFLINE: {
        if(this.props.type === "user" && this.props.item.uid === item.uid) {

          if(this.props.widgetsettings 
          && this.props.widgetsettings.hasOwnProperty("main")
          && this.props.widgetsettings.main.hasOwnProperty("show_user_presence")
          && this.props.widgetsettings.main["show_user_presence"] === false) {
            return false;
          }
          this.setState({ status: item.status, presence: item.status });
        }
        break;
      }
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_LEFT:
        if(this.props.type === "group" 
        && this.props.item.guid === item.guid
        && this.props.loggedInUser.uid !== groupUser.uid) {

          let membersCount = parseInt(item.membersCount);
          const status = `${membersCount} members`;
          this.setState({status: status});
        }
      break;
      case enums.GROUP_MEMBER_JOINED:
        if(this.props.type === "group" && this.props.item.guid === item.guid) {

          let membersCount = parseInt(item.membersCount);
          const status = `${membersCount} members`;
          this.setState({status: status});
        }
      break;
      case enums.GROUP_MEMBER_ADDED:
        if(this.props.type === "group" && this.props.item.guid === item.guid) {

          let membersCount = parseInt(item.membersCount);
          const status = `${membersCount} members`;
          this.setState({status: status});
        }
      break;
      case enums.TYPING_STARTED: {
        
        if (this.props.type === "group" && this.props.type === item.receiverType && this.props.item.guid === item.receiverId) {

          this.setState({ status: `${item.sender.name} is typing...` });
          this.props.actionGenerated("showReaction", item);

        } else if (this.props.type === "user" && this.props.type === item.receiverType && this.props.item.uid === item.sender.uid) {

          this.setState({ status: "typing..." });
          this.props.actionGenerated("showReaction", item);
          
        }
        break;
      }
      case enums.TYPING_ENDED: {

        if (this.props.type === "group" && this.props.type === item.receiverType && this.props.item.guid === item.receiverId) {

          this.setStatusForGroup();
          this.props.actionGenerated("stopReaction", item);

        } else if (this.props.type === "user" && this.props.type === item.receiverType && this.props.item.uid === item.sender.uid) {
          
          this.props.actionGenerated("stopReaction", item);

          if(this.state.presence === "online") {
            this.setState({ status: "online", presence: "online" });
          } else {
            this.setStatusForUser();
          }
        }
        break;
      }
      default:
      break;
    }
  }
    
  toggleTooltip = (event, flag) => {

    const elem = event.target;
    const scrollWidth = elem.scrollWidth;
    const clientWidth = elem.clientWidth;

    if(scrollWidth <= clientWidth) {
      return false;
    }

    if(flag) {
      elem.setAttribute("title", elem.textContent);
    } else {
      elem.removeAttribute("title");
    }
    
  }

  render() {

    let image, presence;
    if(this.props.type === "user") {

      if(!this.props.item.avatar) {

        const uid = this.props.item.uid;
        const char = this.props.item.name.charAt(0).toUpperCase();

        this.props.item.avatar = SvgAvatar.getAvatar(uid, char);
      }

      image = this.props.item.avatar;
      presence = (
        <StatusIndicator
        widgetsettings={this.props.widgetsettings}
        status={this.state.presence}
        cornerRadius="50%" 
        borderColor={this.props.theme.borderColor.primary}
        borderWidth="1px" />
      );

    } else {

      if(!this.props.item.icon) {
        const guid = this.props.item.guid;
        const char = this.props.item.name.charAt(0).toUpperCase();

        this.props.item.icon = SvgAvatar.getAvatar(guid, char);
      }
      image = this.props.item.icon;
    }

    let status = (
      <span css={chatStatusStyle(this.props, this.state)} className="user__status">{this.state.status}</span>
    );

    let audioCallBtn = (
      <div onClick={() => this.props.actionGenerated("audioCall")} css={chatOptionStyle(audioCallIcon)}>
        <img src={audioCallIcon} alt="Voice call" />
      </div>);
    let videoCallBtn = (
      <div onClick={() => this.props.actionGenerated("videoCall")} css={chatOptionStyle(videoCallIcon)}>
        <img src={videoCallIcon} alt="Video call" />
      </div>);
    let viewDetailBtn = (<div onClick={() => this.props.actionGenerated("viewDetail")} css={chatOptionStyle(detailPaneIcon)}>
      <img src={detailPaneIcon} alt="View detail" />
    </div>);
    
    if(this.props.viewdetail === false) {
      viewDetailBtn = null;
    }

    if(this.props.item.blockedByMe === true || this.props.audiocall === false) {
      audioCallBtn = null;
    }

    if(this.props.item.blockedByMe === true || this.props.videocall === false) {
      videoCallBtn = null;
    }

    if(this.props.widgetsettings && this.props.widgetsettings.hasOwnProperty("main")) {

      if(this.props.widgetsettings.main.hasOwnProperty("enable_voice_calling")
      && this.props.widgetsettings.main["enable_voice_calling"] === false) {
        audioCallBtn = null;
      }

      if(this.props.widgetsettings.main.hasOwnProperty("enable_video_calling")
      && this.props.widgetsettings.main["enable_video_calling"] === false) {
        videoCallBtn = null;
      }

      if(this.props.widgetsettings.main.hasOwnProperty("show_user_presence")
      && this.props.widgetsettings.main["show_user_presence"] === false
      && this.props.type === "user") {
        status = null;
      }
      
    }

    return (
      <div css={chatHeaderStyle(this.props)} className="chat__header">
        <div css={chatDetailStyle()} className="chat__details">
          <div css={chatSideBarBtnStyle(menuIcon, this.props)} className="chat__sidebar-menu" onClick={() => this.props.actionGenerated("menuClicked")}></div>
          <div css={chatThumbnailStyle()} className="chat__thumbnail">
            <Avatar 
            image={image} 
            cornerRadius="18px" 
            borderColor={this.props.theme.borderColor.primary}
            borderWidth="1px" />
            {presence}
          </div>
          <div css={chatUserStyle()} className="chat__user">
            <h6 css={chatNameStyle()} className="user__name"
            onMouseEnter={event => this.toggleTooltip(event, true)} 
            onMouseLeave={event => this.toggleTooltip(event, false)}>{this.props.item.name}</h6>
            {status}
          </div>
        </div>
        <div css={chatOptionWrapStyle()} className="chat__options">
          {audioCallBtn}
          {videoCallBtn}
          {viewDetailBtn}
        </div>
      </div>
    );
  }
}

export default MessageHeader;