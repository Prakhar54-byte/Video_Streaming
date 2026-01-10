import  mongoose ,{Schema} from 'mongoose';

const querySchema = new Schema(
    {
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true,
            unique:true,
        },
        videos:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:'Video',
            }
        ]
    },
    {timestamps:true}
)

export const Queue = mongoose.model('Queue',querySchema);