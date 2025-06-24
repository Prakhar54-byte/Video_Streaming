#include <emscripten.h>
#include <cmath>
#include <cstring>

extern "C " EMSCRIPTEN_KEEPALIVE
float* run_infernce(float* features,int count){
    static float results[4]; // buffering_risk , bitrate_stability , 
                             // network_quality , anomaly_score

        // clear results
        memset(results,0,sizeof(results));

        if(count >= 3){
            // Buffering risk prediction ( feature[0] = buffering_ratio )
            results[0] =features[0] > 0.3f ? 1.0f : features[0] * 3.33f;

            // Bitrate stability prediction ( feature[1] = bitrate_variance )
            results[1] = 1.0f - fminf(features[1] ,1.0f);

            // Network quality prediction ( feature[2] = network_quality )
            results[2] = features[2] < 0.5f ? (0.5f - features[2]) * 0.2f : 0.0f;

            // Overall anomaly score(weighted combination   )
            results[3] = (0.5f * results[0]) + 
                         (0.3f * results[1]) + 
                         (0.2f * results[2]);
        }
    return results;
}


extern "C" EMSCRIPTEN_KEEPALIVE
int predict_viewer_churn(float qoe_score,float session_duration,float rebuffer_count){
    //Simple churn prediction model 
    float churn_score = 0.0f;

    //QoE impact (lower QoE = higher churn)
    churn_score += (1.0f - qoe_score) * 0.6f;

    //Session duration impact (shorter sessions = higher churn)
    float duration_penalty = session_duration < 60.0f ? (60.0f - session_duration) / 60.0f : 0.0f;
    churn_score += duration_penalty * 0.3f;

    //Rebuffer count impact (more rebuffering = higher churn)
    churn_score += fminf(rebuffer_count / 10.0f, 1.0f) * 0.1f;

    return churn_score > 0.5f ? 1 : 0; // 1 = churn, 0 = no churn
}