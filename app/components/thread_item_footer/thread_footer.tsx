// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {injectIntl, intlShape} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import Avatars from '@components/avatars';
import CompassIcon from '@components/compass_icon';
import {setThreadFollow} from '@mm-redux/actions/threads';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import type {Theme} from '@mm-redux/types/preferences';
import {getCurrentUserId} from '@mm-redux/selectors/entities/common';
import {getCurrentTeamId} from '@mm-redux/selectors/entities/teams';
import type {GlobalState} from '@mm-redux/types/store';
import {UserThread} from '@mm-redux/types/threads';
import {UserProfile} from '@mm-redux/types/users';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

type Props = {
    intl: typeof intlShape;
    threadStarter: UserProfile;
    thread: UserThread;
    location: 'globalThreads' | 'channel';
}

function ThreadFooter({intl, location, thread, threadStarter}: Props) {
    const theme = useSelector((state: GlobalState) => getTheme(state));
    const currentUserId = useSelector((state: GlobalState) => getCurrentUserId(state));
    const currentTeamId = useSelector((state: GlobalState) => getCurrentTeamId(state));
    const style = getStyleSheet(theme);
    const dispatch = useDispatch();

    const onUnfollow = () => {
        dispatch(setThreadFollow(currentUserId, currentTeamId, thread.id, false));
    };

    const onFollow = () => {
        dispatch(setThreadFollow(currentUserId, currentTeamId, thread.id, true));
    };

    let replyIcon;
    let followButton;
    if (location === 'channel') {
        replyIcon = (
            <View style={style.replyIconContainer}>
                <CompassIcon
                    name='reply-outline'
                    size={18}
                    color={changeOpacity(theme.centerChannelColor, 0.64)}
                />
            </View>
        );
        if (thread.is_following) {
            followButton = (
                <TouchableOpacity
                    onPress={preventDoubleTap(onUnfollow)}
                    style={style.followingButtonContainer}
                >
                    <Text style={style.following}>
                        {intl.formatMessage({
                            id: 'threads.following',
                            defaultMessage: 'Following',
                        })}
                    </Text>
                </TouchableOpacity>
            );
        } else {
            followButton = (
                <>
                    <View style={style.followSeparator}/>
                    <TouchableOpacity
                        onPress={preventDoubleTap(onFollow)}
                        style={style.notFollowingButtonContainer}
                    >
                        <Text style={style.notFollowing}>
                            {intl.formatMessage({
                                id: 'threads.follow',
                                defaultMessage: 'Follow',
                            })}
                        </Text>
                    </TouchableOpacity>
                </>
            );
        }
    }

    // threadstarter should be the first one in the avatars list
    const participants = thread.participants.flatMap((participant) => (participant.id === threadStarter?.id ? [] : participant.id));
    participants?.unshift(threadStarter?.id);

    let repliesComponent;
    if (thread.unread_replies && location === 'globalThreads') {
        repliesComponent = (
            <Text style={style.unreadReplies}>
                {intl.formatMessage({
                    id: 'threads.newReplies',
                    defaultMessage: '{count} new {count, plural, one {reply} other {replies}}',
                }, {
                    count: thread.unread_replies,
                })}
            </Text>
        );
    } else {
        repliesComponent = (
            <Text style={style.replies}>
                {intl.formatMessage({
                    id: 'threads.replies',
                    defaultMessage: '{count} {count, plural, one {reply} other {replies}}',
                }, {
                    count: thread.reply_count,
                })}
            </Text>
        );
    }

    return (
        <View style={style.footerContainer}>
            <View style={style.avatarsContainer}>
                <Avatars
                    style={style.avatars}
                    userIds={participants}
                />
            </View>
            {replyIcon}
            {repliesComponent}
            {followButton}
        </View>
    );
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    const followingButtonContainerBase = {
        justifyContent: 'center',
        height: 32,
        marginLeft: 12,
        paddingHorizontal: 12,
    };

    return {
        footerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        avatarsContainer: {
            marginRight: 12,
        },
        avatars: {flex: 1},
        replyIconContainer: {
            top: -1,
            marginRight: 5,
        },
        replies: {
            alignSelf: 'center',
            color: changeOpacity(theme.centerChannelColor, 0.64),
            fontSize: 12,
        },
        unreadReplies: {
            alignSelf: 'center',
            color: theme.sidebarTextActiveBorder,
        },
        notFollowingButtonContainer: {
            ...followingButtonContainerBase,
            paddingLeft: 0,
        },
        notFollowing: {
            color: changeOpacity(theme.centerChannelColor, 0.64),
            fontWeight: '600',
            fontSize: 12,
        },
        followingButtonContainer: {
            ...followingButtonContainerBase,
            backgroundColor: changeOpacity(theme.sidebarTextActiveBorder, 0.08),
            borderRadius: 4,
        },
        following: {
            color: changeOpacity(theme.centerChannelColor, 0.64),
            fontWeight: '600',
            fontSize: 12,
        },
        followSeparator: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.16),
            height: 16,
            marginLeft: 12,
            width: 1,
        },
    };
});

export default injectIntl(ThreadFooter);