import mongoose, { isValidObjectId } from 'mongoose'
import { Tweet } from '../models/tweet.model.js'
import { User } from '../models/user.model.js'
import { Subscription } from '../models/subscription.model.js'
import { AutoWelcome } from '../models/autoWelcome.model.js'
import { Video } from '../models/video.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const createTweet = asyncHandler(async (req, res) => {
  const { content, parentTweetId } = req.body
  console.log('test', req.body)

  if (!content) {
    throw new ApiError(400, 'Their is nothing to tweet')
  }

  const tweetData = {
    content,
    owner: req.user._id
  }

  if (parentTweetId && isValidObjectId(parentTweetId)) {
    tweetData.parentTweet = parentTweetId
  }

  const tweet = await Tweet.create(tweetData)

  const createdTweet = await Tweet.aggregate([
    {
      $match: {
        _id: tweet._id
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerDetails'
      }
    },
    { $unwind: '$ownerDetails' },
    {
      $lookup: {
        from: 'tweets',
        localField: 'parentTweet',
        foreignField: '_id',
        as: 'parentTweetDetails'
      }
    },
    {
      $unwind: {
        path: '$parentTweetDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'parentTweetDetails.owner',
        foreignField: '_id',
        as: 'parentTweetOwner'
      }
    },
    {
      $unwind: {
        path: '$parentTweetOwner',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        likesCount: { $literal: 0 },
        isLiked: { $literal: false },
        owner: {
          _id: '$ownerDetails._id',
          username: '$ownerDetails.username',
          fullName: '$ownerDetails.fullName',
          avatar: '$ownerDetails.avatar'
        },
        parentTweet: {
          $cond: {
            if: { $ifNull: ['$parentTweetDetails', false] },
            then: {
              _id: '$parentTweetDetails._id',
              content: '$parentTweetDetails.content',
              owner: {
                username: '$parentTweetOwner.username',
                fullName: '$parentTweetOwner.fullName'
              }
            },
            else: null
          }
        }
      }
    }
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, createdTweet[0], 'Tweet created successfully'))
})

const getAllTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerDetails'
      }
    },
    { $unwind: '$ownerDetails' },
    {
      $lookup: {
        from: 'tweets',
        localField: 'parentTweet',
        foreignField: '_id',
        as: 'parentTweetDetails'
      }
    },
    {
      $unwind: {
        path: '$parentTweetDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'parentTweetDetails.owner',
        foreignField: '_id',
        as: 'parentTweetOwner'
      }
    },
    {
      $unwind: {
        path: '$parentTweetOwner',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'tweet',
        as: 'likes'
      }
    },
    {
      $addFields: {
        likesCount: { $size: '$likes' },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, '$likes.likedBy'] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $sort: {
        createdAt: -1
      }
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        likesCount: 1,
        isLiked: 1,
        owner: {
          _id: '$ownerDetails._id',
          username: '$ownerDetails.username',
          fullName: '$ownerDetails.fullName',
          avatar: '$ownerDetails.avatar'
        },
        parentTweet: {
          $cond: {
            if: { $ifNull: ['$parentTweetDetails', false] },
            then: {
              _id: '$parentTweetDetails._id',
              content: '$parentTweetDetails.content',
              owner: {
                username: '$parentTweetOwner.username',
                fullName: '$parentTweetOwner.fullName'
              }
            },
            else: null
          }
        }
      }
    }
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, 'All tweets fetched successfully'))
})

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const userId = req.user._id ? req.user._id : req.params.userId

  console.log('Check msg', userId)

  if (!userId) {
    throw new ApiError(400, 'User not found')
  }
  const tweet = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerDetails'
      }
    },
    { $unwind: '$ownerDetails' },
    {
      $lookup: {
        from: 'tweets',
        localField: 'parentTweet',
        foreignField: '_id',
        as: 'parentTweetDetails'
      }
    },
    {
      $unwind: {
        path: '$parentTweetDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'parentTweetDetails.owner',
        foreignField: '_id',
        as: 'parentTweetOwner'
      }
    },
    {
      $unwind: {
        path: '$parentTweetOwner',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'tweet',
        as: 'likes'
      }
    },
    {
      $addFields: {
        likesCount: { $size: '$likes' },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, '$likes.likedBy'] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        likesCount: 1,
        isLiked: 1,
        owner: {
          _id: '$ownerDetails._id',
          username: '$ownerDetails.username',
          fullName: '$ownerDetails.fullName',
          avatar: '$ownerDetails.avatar'
        },
        parentTweet: {
          $cond: {
            if: { $ifNull: ['$parentTweetDetails', false] },
            then: {
              _id: '$parentTweetDetails._id',
              content: '$parentTweetDetails.content',
              owner: {
                username: '$parentTweetOwner.username',
                fullName: '$parentTweetOwner.fullName'
              }
            },
            else: null
          }
        }
      }
    }
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, 'User tweets fetched successfully'))
})

const updateTweet = asyncHandler(async (req, res) => {
  // TODO: update tweet
  const { content } = req.body
  const { tweetId } = req.params

  if (!tweetId) {
    throw new ApiError(400, 'Invalid tweet ID')
  }
  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Content cannot be empty')
  }
  const tweet = await Tweet.findByIdAndUpdate(
    {
      _id: tweetId,
      owner: req.user._id
    },
    {
      $set: { content }
    },
    {
      new: true
    }
  )
  const tweetData = tweet.toObject()

  tweetData.owner = {
    _id: req.user._id,
    username: req.user.username,
    fullName: req.user.fullName,
    avatar: req.user.avatar
  }
  if (!tweet) {
    throw new ApiError(400, 'Tweet not found or you are not owner')
  }

  return res.status(200).json(new ApiResponse(200, tweetData, 'Tweet added'))
})

const deleteTweet = asyncHandler(async (req, res) => {
  // TODO: delete tweet
  const { tweetId } = req.params
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Tweet ID is not found ')
  }

  const tweet = await Tweet.findByIdAndDelete({
    _id: tweetId,
    owner: req.user._id
  })

  if (!tweet) {
    throw new ApiError(400, "Tweet not found or you're not the owner")
  }

  return res.status(200).json(new ApiResponse(200, 'Tweet is deleted'))
})

// Helper: Determine message tier based on relationship
const determineMessageTier = async (senderId, receiverId) => {
  const receiverSubscribedToSender = await Subscription.findOne({
    subscriber: receiverId,
    channel: senderId
  })

  const senderSubscribedToReceiver = await Subscription.findOne({
    subscriber: senderId,
    channel: receiverId
  })

  if (receiverSubscribedToSender) {
    return 'subscriber'
  } else if (senderSubscribedToReceiver) {
    return 'following'
  } else {
    return 'non_subscriber'
  }
}

// Helper: Calculate badges for a user
const calculateBadges = async (userId, channelId) => {
  const badges = []

  const subscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId
  })

  if (subscription) {
    const daysSinceSubscription =
      (Date.now() - new Date(subscription.createdAt)) / (1000 * 60 * 60 * 24)
    if (daysSinceSubscription <= 7) {
      badges.push('new_subscriber')
    }
    if (daysSinceSubscription >= 365) {
      badges.push('early_supporter')
    }

    const allSubscribers = await Subscription.countDocuments({
      channel: channelId
    })
    if (allSubscribers > 0) {
      const topFanThreshold = Math.max(1, Math.ceil(allSubscribers * 0.01))
      const userRank = await Subscription.countDocuments({
        channel: channelId,
        createdAt: { $lte: subscription.createdAt }
      })
      if (userRank <= topFanThreshold) {
        badges.push('top_fan')
      }
    }
  }

  try {
    const watchHistory = await User.findById(userId).select('watchHistory')
    if (
      watchHistory &&
      watchHistory.watchHistory &&
      watchHistory.watchHistory.length >= 10
    ) {
      badges.push('watched_10_plus')
    }
  } catch (error) {
    console.log('Watch history check skipped:', error.message)
  }

  return badges
}

// Send a message (using tweet model)
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content, messageType, metadata } = req.body
  const senderId = req.user._id

  if (!receiverId || !content) {
    throw new ApiError(400, 'Receiver and content are required')
  }

  const receiver = await User.findById(receiverId)
  if (!receiver) {
    throw new ApiError(404, 'Receiver not found')
  }

  const tier = await determineMessageTier(senderId, receiverId)
  const badges = await calculateBadges(senderId, receiverId)

  const message = await Tweet.create({
    content,
    owner: senderId,
    receiver: receiverId,
    isMessage: true,
    messageType: messageType || 'text',
    tier,
    badges,
    metadata: metadata || {}
  })

  const populatedMessage = await Tweet.findById(message._id)
    .populate('owner', 'username fullName avatar')
    .populate('receiver', 'username fullName avatar')

  return res
    .status(201)
    .json(new ApiResponse(201, populatedMessage, 'Message sent successfully'))
})

// Get inbox by tier (Priority Inbox)
const getInboxByTier = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const { tier } = req.query

  const matchQuery = {
    $or: [{ owner: userId, receiver: { $ne: null } }, { receiver: userId }],
    isMessage: true
  }

  if (tier && tier !== 'all') {
    matchQuery.tier = tier
  }

  const messages = await Tweet.aggregate([
    { $match: matchQuery },
    {
      $addFields: {
        otherUserId: {
          $cond: {
            if: { $eq: ['$owner', new mongoose.Types.ObjectId(userId)] },
            then: '$receiver',
            else: '$owner'
          }
        }
      }
    },
    {
      $group: {
        _id: '$otherUserId',
        lastMessage: { $last: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        },
        tier: { $last: '$tier' },
        badges: { $last: '$badges' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'otherUser'
      }
    },
    { $unwind: '$otherUser' },
    {
      $project: {
        _id: 1,
        otherUser: {
          _id: '$otherUser._id',
          username: '$otherUser.username',
          fullName: '$otherUser.fullName',
          avatar: '$otherUser.avatar'
        },
        tier: 1,
        badges: 1,
        lastMessage: {
          content: '$lastMessage.content',
          createdAt: '$lastMessage.createdAt',
          messageType: '$lastMessage.messageType'
        },
        unreadCount: 1,
        updatedAt: '$lastMessage.updatedAt'
      }
    },
    { $sort: { updatedAt: -1 } }
  ])

  const grouped = {
    subscriber: [],
    following: [],
    non_subscriber: []
  }

  messages.forEach((conv) => {
    if (grouped[conv.tier]) {
      grouped[conv.tier].push(conv)
    }
  })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        tier === 'all' ? grouped : messages,
        'Inbox fetched successfully'
      )
    )
})

// Get conversation messages
const getConversationMessages = asyncHandler(async (req, res) => {
  const { otherUserId } = req.params
  const userId = req.user._id
  const { page = 1, limit = 50 } = req.query

  const skip = (page - 1) * limit

  const messages = await Tweet.find({
    isMessage: true,
    $or: [
      { owner: userId, receiver: otherUserId },
      { owner: otherUserId, receiver: userId }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('owner', 'username fullName avatar')
    .populate('receiver', 'username fullName avatar')

  await Tweet.updateMany(
    { owner: otherUserId, receiver: userId, isRead: false, isMessage: true },
    { isRead: true }
  )

  return res
    .status(200)
    .json(
      new ApiResponse(200, messages.reverse(), 'Messages fetched successfully')
    )
})

// Setup auto-welcome message
const setupAutoWelcome = asyncHandler(async (req, res) => {
  const creatorId = req.user._id
  const {
    enabled,
    message,
    includeVideo,
    videoId,
    includeCoupon,
    couponCode,
    couponDescription,
    includePoll,
    pollQuestion,
    pollOptions
  } = req.body

  if (includeVideo && videoId) {
    const video = await Video.findOne({ _id: videoId, owner: creatorId })
    if (!video) {
      throw new ApiError(404, 'Video not found or not owned by you')
    }
  }

  let autoWelcome = await AutoWelcome.findOne({ creator: creatorId })

  if (!autoWelcome) {
    autoWelcome = await AutoWelcome.create({
      creator: creatorId,
      enabled: enabled || false,
      message: message || 'Thanks for subscribing! 🎉',
      includeVideo: includeVideo || false,
      videoId: videoId || null,
      includeCoupon: includeCoupon || false,
      couponCode: couponCode || null,
      couponDescription: couponDescription || null,
      includePoll: includePoll || false,
      pollQuestion: pollQuestion || null,
      pollOptions: pollOptions || []
    })
  } else {
    autoWelcome.enabled = enabled !== undefined ? enabled : autoWelcome.enabled
    autoWelcome.message = message || autoWelcome.message
    autoWelcome.includeVideo =
      includeVideo !== undefined ? includeVideo : autoWelcome.includeVideo
    autoWelcome.videoId = videoId || autoWelcome.videoId
    autoWelcome.includeCoupon =
      includeCoupon !== undefined ? includeCoupon : autoWelcome.includeCoupon
    autoWelcome.couponCode = couponCode || autoWelcome.couponCode
    autoWelcome.couponDescription =
      couponDescription || autoWelcome.couponDescription
    autoWelcome.includePoll =
      includePoll !== undefined ? includePoll : autoWelcome.includePoll
    autoWelcome.pollQuestion = pollQuestion || autoWelcome.pollQuestion
    autoWelcome.pollOptions = pollOptions || autoWelcome.pollOptions
    await autoWelcome.save()
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        autoWelcome,
        'Auto-welcome message configured successfully'
      )
    )
})

// Get auto-welcome config
const getAutoWelcomeConfig = asyncHandler(async (req, res) => {
  const creatorId = req.user._id

  const autoWelcome = await AutoWelcome.findOne({
    creator: creatorId
  }).populate('videoId', 'title thumbnail')

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        autoWelcome || { enabled: false },
        'Auto-welcome config fetched successfully'
      )
    )
})

// Trigger auto-welcome (called when someone subscribes)
const triggerAutoWelcome = async (subscriberId, channelId) => {
  try {
    const autoWelcome = await AutoWelcome.findOne({
      creator: channelId,
      enabled: true
    })

    if (!autoWelcome) return

    let messageContent = autoWelcome.message
    const metadata = {}

    if (autoWelcome.includeVideo && autoWelcome.videoId) {
      metadata.videoId = autoWelcome.videoId
      messageContent += '\n\n🎥 Check out this video!'
    }

    if (autoWelcome.includeCoupon && autoWelcome.couponCode) {
      metadata.couponCode = autoWelcome.couponCode
      messageContent += `\n\n🎁 Use coupon code: ${autoWelcome.couponCode}`
      if (autoWelcome.couponDescription) {
        messageContent += `\n${autoWelcome.couponDescription}`
      }
    }

    if (autoWelcome.includePoll && autoWelcome.pollQuestion) {
      metadata.pollOptions = autoWelcome.pollOptions
      messageContent += `\n\n📊 Poll: ${autoWelcome.pollQuestion}`
    }

    const badges = await calculateBadges(subscriberId, channelId)

    await Tweet.create({
      owner: channelId,
      receiver: subscriberId,
      content: messageContent,
      isMessage: true,
      messageType: 'auto_welcome',
      metadata,
      tier: 'subscriber',
      badges
    })
  } catch (error) {
    console.error('Auto-welcome message error:', error)
  }
}

export {
  createTweet,
  getAllTweets,
  getUserTweets,
  updateTweet,
  deleteTweet,
  sendMessage,
  getInboxByTier,
  getConversationMessages,
  setupAutoWelcome,
  getAutoWelcomeConfig,
  triggerAutoWelcome
}
