const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    topic_id: {type: Schema.Types.ObjectId, ref: 'topic', required: true},
    comment: {type: String, required: true},
    author_user: {type: String, required: true},
    created_ts: {type: Date, default: Date.now(), required: true}
});

var model = mongoose.model('comment', commentSchema);

model.getAll = function(query, limit, page, user, callback){
    var logger = require('npmlog');
    var db = require('../db');
    var skip = limit * (page - 1);
    logger.verbose("Comment get all, skip, limit", skip, limit);
    db.Comment.aggregate([
        {
            $lookup:{
                from: "permissions",
                let: { commentId: "$_id" },
                pipeline: [{
                    $match: {
                        $expr: {
                            $and: [
                                {$or: [
                                    {$eq: ["$comment_id", "commentId"] },
                                    {$eq: ["$comment_id", "*"] }
                                ]},
                                {$or: [
                                    {user_ids: user.id},
                                    {user_ids: "*"},
                                    {$in: ["$group_ids", user.Groups]},
                                    {group_ids: "*"}
                                ]},
                                {$eq: ["$allow", false]}
                            ]
                        }
                    }},
                    {$sort: {priority: 1}}
                ],
                as: "permissions"
            }
        },
        {
            $match:{
                "permissions.0": {$exists: false}
            }
        },
        {
            $project: {"permissions": 0}
        }
    ]).limit(limit).skip(skip).exec(callback);
};

module.exports = model;