import numpy as np
from wasmer import engine, Store, Module, Instance
import json
import logging
from kafka import KafkaConsumer, KafkaProducer
import time

class WasmInferenceEngine:
    def __init__(self, wasm_path):
        with open(wasm_path, 'rb') as f:
            wasm_bytes = f.read()
        
        store = Store()
        module = Module(store, wasm_bytes)
        self.instance = Instance(module)
        self.run_inference = self.instance.exports.run_inference
        self.predict_churn = self.instance.exports.predict_viewer_churn
        
    def detect_anomalies(self, features):
        """
        Run anomaly detection inference
        features: [buffering_ratio, bitrate_variance, network_quality]
        """
        try:
            # Allocate memory for input
            input_size = len(features) * 4  # 4 bytes per float
            input_ptr = self.instance.exports.malloc(input_size)
            
            # Copy features to Wasm memory
            memory = self.instance.exports.memory.uint8_view()
            input_data = np.array(features, dtype=np.float32)
            memory[input_ptr:input_ptr+input_size] = input_data.tobytes()
            
            # Run inference
            output_ptr = self.run_inference(input_ptr, len(features))
            
            # Read results (4 float values)
            results = np.frombuffer(
                memory[output_ptr:output_ptr+16], 
                dtype=np.float32
            )
            
            # Free memory
            self.instance.exports.free(input_ptr)
            
            return {
                "buffering_risk": float(results[0]),
                "bitrate_stability": float(results[1]),
                "network_failure_prob": float(results[2]),
                "overall_anomaly_score": float(results[3])
            }
            
        except Exception as e:
            logging.error(f"Inference error: {e}")
            return None
    
    def predict_viewer_churn(self, qoe_score, session_duration, rebuffer_count):
        """Predict if viewer will churn"""
        try:
            churn_prediction = self.predict_churn(qoe_score, session_duration, rebuffer_count)
            return bool(churn_prediction)
        except Exception as e:
            logging.error(f"Churn prediction error: {e}")
            return False

class RealTimeAnalytics:
    def __init__(self, wasm_path, kafka_servers="localhost:9092"):
        self.inference_engine = WasmInferenceEngine(wasm_path)
        self.consumer = KafkaConsumer(
            'video-sessions',
            bootstrap_servers=kafka_servers,
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        self.producer = KafkaProducer(
            bootstrap_servers=kafka_servers,
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        
    def process_session(self, session_data):
        """Process individual session for anomalies"""
        try:
            # Extract features for anomaly detection
            features = [
                session_data.get('buffering_ratio', 0.0),
                session_data.get('bitrate_variance', 0.0),
                session_data.get('network_quality', 1.0)
            ]
            
            # Run anomaly detection
            anomaly_results = self.inference_engine.detect_anomalies(features)
            
            if anomaly_results:
                # Predict viewer churn
                churn_prediction = self.inference_engine.predict_viewer_churn(
                    session_data.get('qoe_score', 0.5),
                    session_data.get('session_duration', 0),
                    session_data.get('rebuffer_count', 0)
                )
                
                # Enrich session with ML predictions
                enriched_session = {
                    **session_data,
                    'ml_predictions': {
                        **anomaly_results,
                        'churn_prediction': churn_prediction,
                        'prediction_timestamp': time.time()
                    }
                }
                
                # Send to output topic
                self.producer.send('ml-enriched-sessions', enriched_session)
                
                # Send alerts for high anomaly scores
                if anomaly_results['overall_anomaly_score'] > 0.8:
                    alert = {
                        'session_id': session_data.get('session_id'),
                        'video_id': session_data.get('video_id'),
                        'anomaly_score': anomaly_results['overall_anomaly_score'],
                        'alert_type': 'high_anomaly',
                        'timestamp': time.time()
                    }
                    self.producer.send('anomaly-alerts', alert)
                
                return enriched_session
            
        except Exception as e:
            logging.error(f"Session processing error: {e}")
            return None
    
    def run(self):
        """Main processing loop"""
        logging.info("Starting real-time inference engine...")
        
        for message in self.consumer:
            session_data = message.value
            processed_session = self.process_session(session_data)
            
            if processed_session:
                logging.info(f"Processed session {session_data.get('session_id')}")

def main():
    logging.basicConfig(level=logging.INFO)
    
    # Initialize real-time analytics
    analytics = RealTimeAnalytics("lib/wasm/inference_engine.wasm")
    
    # Start processing
    analytics.run()

if __name__ == "__main__":
    main()
