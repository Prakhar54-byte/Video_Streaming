from pyflink.datastream import StreamExecutionEnvironment, ProcessFunction, KeyedProcessFunction
from pyflink.datastream.connectors import KafkaSource, KafkaSink
from pyflink.common.serialization import JsonRowDeserializationSchema, JsonRowSerializationSchema
from pyflink.common.watermark_strategy import WatermarkStrategy
from pyflink.common.time import Time
from pyflink.datastream.window import TumblingEventTimeWindows
import wasmtime
import json
import logging

class WasmQoEProcessor(KeyedProcessFunction):
    def __init__(self, wasm_path):
        self.wasm_path = wasm_path
        self.engine = None
        self.instance = None
        
    def open(self, runtime_context):
        self.engine = wasmtime.Engine()
        with open(self.wasm_path, 'rb') as f:
            wasm_bytes = f.read()
        module = wasmtime.Module(self.engine, wasm_bytes)
        store = wasmtime.Store(self.engine)
        self.instance = wasmtime.Instance(store, module, [])
        self.calculate_qoe = self.instance.exports["calculate_qoe"]
        self.classify_qoe = self.instance.exports["classify_qoe"]
        
    def process_element(self, session, ctx):
        try:
            # Calculate QoE using Wasm
            qoe_score = self.calculate_qoe(
                ctx.get_current_key(),
                session['avg_bitrate'],
                session['buffering_ratio'],
                session['startup_delay']
            )
            
            # Classify QoE
            qoe_class = self.classify_qoe(ctx.get_current_key(), qoe_score)
            
            # Enrich session data
            enriched_session = {
                **session,
                'qoe_score': qoe_score,
                'qoe_class': qoe_class,
                'timestamp': ctx.timestamp()
            }
            
            yield enriched_session
            
        except Exception as e:
            logging.error(f"QoE processing error: {e}")
            yield session

class WasmAnomalyDetector(ProcessFunction):
    def __init__(self, wasm_path):
        self.wasm_path = wasm_path
        self.engine = None
        self.instance = None
        
    def open(self, runtime_context):
        self.engine = wasmtime.Engine()
        with open(self.wasm_path, 'rb') as f:
            wasm_bytes = f.read()
        module = wasmtime.Module(self.engine, wasm_bytes)
        store = wasmtime.Store(self.engine)
        self.instance = wasmtime.Instance(store, module, [])
        self.detect_anomaly = self.instance.exports["detect_anomaly"]
        
    def process_element(self, session, ctx):
        try:
            # Detect anomaly using Wasm
            is_anomaly = self.detect_anomaly(
                ctx.get_current_key(),
                session['buffering_ratio'],
                session.get('bitrate_variance', 0.0),
                session.get('network_quality', 1.0)
            )
            
            # Add anomaly flag
            result = {
                **session,
                'is_anomaly': bool(is_anomaly),
                'anomaly_timestamp': ctx.timestamp() if is_anomaly else None
            }
            
            yield result
            
        except Exception as e:
            logging.error(f"Anomaly detection error: {e}")
            yield session

def main():
    # Initialize Flink environment
    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_parallelism(4)
    env.enable_checkpointing(10000)  # 10 seconds
    
    # Add required JARs
    env.add_jars("file:///opt/flink/lib/flink-connector-kafka-1.17.0.jar")
    
    # Kafka source configuration
    source = KafkaSource.builder() \
        .set_bootstrap_servers("kafka:9092") \
        .set_topics("video-sessions") \
        .set_group_id("spark-analytics") \
        .set_value_only_deserializer(JsonRowDeserializationSchema()) \
        .build()
    
    # Create data stream
    data_stream = env.from_source(
        source,
        WatermarkStrategy.for_monotonous_timestamps(),
        "Video Sessions Source"
    )
    
    # Process with Wasm UDFs
    processed_stream = data_stream \
        .key_by(lambda x: x['session_id']) \
        .window(TumblingEventTimeWindows.of(Time.seconds(30))) \
        .process(SessionAggregator()) \
        .process(WasmQoEProcessor("lib/wasm/qoe_calculator.wasm")) \
        .process(WasmAnomalyDetector("lib/wasm/anomaly_detector.wasm"))
    
    # Sink processed data
    kafka_sink = KafkaSink.builder() \
        .set_bootstrap_servers("kafka:9092") \
        .set_record_serializer(JsonRowSerializationSchema("processed-sessions")) \
        .build()
    
    processed_stream.sink_to(kafka_sink)
    
    # Separate anomaly alerts
    anomaly_stream = processed_stream.filter(lambda x: x.get('is_anomaly', False))
    
    alert_sink = KafkaSink.builder() \
        .set_bootstrap_servers("kafka:9092") \
        .set_record_serializer(JsonRowSerializationSchema("anomaly-alerts")) \
        .build()
    
    anomaly_stream.sink_to(alert_sink)
    
    # Execute pipeline
    env.execute("Spark Video Analytics Pipeline")

class SessionAggregator:
    def process(self, sessions):
        # Aggregate session metrics over window
        total_sessions = len(sessions)
        avg_bitrate = sum(s['bitrate'] for s in sessions) / total_sessions
        avg_buffering = sum(s['buffering_events'] for s in sessions) / total_sessions
        
        return {
            'session_count': total_sessions,
            'avg_bitrate': avg_bitrate,
            'buffering_ratio': avg_buffering / max(1, total_sessions),
            'startup_delay': sum(s.get('startup_delay', 0) for s in sessions) / total_sessions
        }

if __name__ == "__main__":
    main()
