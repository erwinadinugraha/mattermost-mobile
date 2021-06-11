// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {Types} from '@constants';
import {THREAD} from '@constants/screen';
import {createPost, removePost} from '@mm-redux/actions/posts';
import {Posts} from '@mm-redux/constants';
import {isChannelReadOnlyById} from '@mm-redux/selectors/entities/channels';
import {getPost, makeGetCommentCountForPost, makeIsPostCommentMention} from '@mm-redux/selectors/entities/posts';
import {getUser, getCurrentUserId} from '@mm-redux/selectors/entities/users';
import {getMyPreferences, getTheme, isCollapsedThreadsEnabled} from '@mm-redux/selectors/entities/preferences';
import {getThread} from '@mm-redux/selectors/entities/threads';
import {isDateLine, isStartOfNewMessages} from '@mm-redux/utils/post_list';
import {isPostFlagged, isSystemMessage} from '@mm-redux/utils/post_utils';

import {insertToDraft, setPostTooltipVisible} from 'app/actions/views/channel';

import Post from './post';

function isConsecutivePost(post, previousPost) {
    let consecutivePost = false;

    if (post && previousPost) {
        const postFromWebhook = Boolean(post?.props?.from_webhook); // eslint-disable-line camelcase
        const prevPostFromWebhook = Boolean(previousPost?.props?.from_webhook); // eslint-disable-line camelcase
        if (previousPost && previousPost.user_id === post.user_id &&
            post.create_at - previousPost.create_at <= Posts.POST_COLLAPSE_TIMEOUT &&
            !postFromWebhook && !prevPostFromWebhook &&
            !isSystemMessage(post) && !isSystemMessage(previousPost) &&
            (previousPost.root_id === post.root_id || previousPost.id === post.root_id)) {
            // The last post and this post were made by the same user within some time
            consecutivePost = true;
        }
    }
    return consecutivePost;
}

function makeMapStateToProps() {
    const getCommentCountForPost = makeGetCommentCountForPost();
    const isPostCommentMention = makeIsPostCommentMention();
    return function mapStateToProps(state, ownProps) {
        const post = ownProps.post || getPost(state, ownProps.postId);
        const previousPostId = (isStartOfNewMessages(ownProps.previousPostId) || isDateLine(ownProps.previousPostId)) ? ownProps.beforePrevPostId : ownProps.previousPostId;
        const previousPost = getPost(state, previousPostId);
        const beforePrevPost = getPost(state, ownProps.beforePrevPostId);

        const myPreferences = getMyPreferences(state);
        const currentUserId = getCurrentUserId(state);
        const user = getUser(state, post.user_id);
        const isCommentMention = isPostCommentMention(state, post.id);
        let isFirstReply = true;
        let isLastReply = true;
        let commentedOnPost = null;

        if (ownProps.renderReplies && post && post.root_id) {
            if (previousPostId) {
                if (previousPost && (previousPost.id === post.root_id || previousPost.root_id === post.root_id)) {
                    // Previous post is root post or previous post is in same thread
                    isFirstReply = false;
                } else {
                    // Last post is not a comment on the same message
                    commentedOnPost = getPost(state, post.root_id);
                }
            }

            if (ownProps.nextPostId) {
                const nextPost = getPost(state, ownProps.nextPostId);

                if (nextPost && nextPost.root_id === post.root_id) {
                    isLastReply = false;
                }
            }
        }

        const collapsedThreadsEnabled = isCollapsedThreadsEnabled(state);

        let thread = Types.EMTPY_OBJECT;
        if (collapsedThreadsEnabled && ownProps.location !== THREAD) {
            thread = getThread(state, post.id);

            // If user is not following the thread, make thread object from the post
            if (!thread && post.participants?.length && !post.is_following) {
                const {id, reply_count, last_reply_at, participants} = post;
                thread = {
                    id,
                    reply_count,
                    participants,
                    last_reply_at,
                    post,
                    last_viewed_at: 0,
                    unread_mentions: 0,
                    unread_replies: 0,
                };
            }
        }

        return {
            channelIsReadOnly: isChannelReadOnlyById(state, post.channel_id),
            currentUserId,
            post,
            isBot: (user ? user.is_bot : false),
            isFirstReply,
            isLastReply,
            consecutivePost: isConsecutivePost(post, previousPost),
            collapsedThreadsEnabled,
            hasComments: getCommentCountForPost(state, {post}) > 0,
            commentedOnPost,
            theme: getTheme(state),
            isFlagged: isPostFlagged(post.id, myPreferences),
            isCommentMention,
            previousPostExists: Boolean(previousPost),
            thread,
            threadStarter: getUser(state, post.user_id),
            beforePrevPostUserId: (beforePrevPost ? beforePrevPost.user_id : null),
        };
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            createPost,
            removePost,
            setPostTooltipVisible,
            insertToDraft,
        }, dispatch),
    };
}

export default connect(makeMapStateToProps, mapDispatchToProps)(Post);
