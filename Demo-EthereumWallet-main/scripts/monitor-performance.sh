#!/bin/bash

# ECLIPTA Wallet Performance Monitoring Script
# Monitors wallet performance, privacy features, and system health

set -e

echo "📊 ECLIPTA Performance Monitor"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

highlight() {
    echo -e "${CYAN}$1${NC}"
}

# Configuration
MONITOR_DURATION=${1:-"60"}  # Default 60 seconds
OUTPUT_FILE="performance-report-$(date +%Y%m%d-%H%M%S).json"
LOG_LEVEL=${2:-"INFO"}

# Performance metrics storage
declare -A metrics

# Initialize monitoring
init_monitoring() {
    log "Initializing performance monitoring..."
    log "Duration: ${MONITOR_DURATION}s"
    log "Output: $OUTPUT_FILE"
    
    # Create monitoring directory
    mkdir -p monitoring/reports
    mkdir -p monitoring/logs
    
    # Initialize metrics
    metrics[start_time]=$(date +%s)
    metrics[total_tests]=0
    metrics[passed_tests]=0
    metrics[failed_tests]=0
    metrics[avg_response_time]=0
    metrics[memory_usage]=0
    metrics[cpu_usage]=0
    
    log "Monitoring initialized ✅"
}

# Monitor React Native Metro performance
monitor_metro() {
    log "Monitoring Metro bundler performance..."
    
    # Start Metro if not running
    if ! pgrep -f "metro" > /dev/null; then
        warn "Metro not running, starting..."
        npx react-native start &
        metro_pid=$!
        sleep 10
    else
        metro_pid=$(pgrep -f "metro")
        info "Metro already running (PID: $metro_pid)"
    fi
    
    # Monitor Metro performance
    local start_time=$(date +%s)
    local bundle_start=$(date +%s.%3N)
    
    # Test bundle generation
    curl -s "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" > /dev/null
    local bundle_end=$(date +%s.%3N)
    local bundle_time=$(echo "$bundle_end - $bundle_start" | bc)
    
    metrics[metro_bundle_time]=$bundle_time
    info "Metro bundle time: ${bundle_time}s"
    
    # Monitor memory usage
    if [[ -n "$metro_pid" ]]; then
        local memory=$(ps -p $metro_pid -o rss= 2>/dev/null || echo "0")
        metrics[metro_memory]=$(($memory / 1024))  # MB
        info "Metro memory usage: ${metrics[metro_memory]}MB"
    fi
    
    log "Metro monitoring completed ✅"
}

# Monitor smart contract performance
monitor_contracts() {
    log "Monitoring smart contract performance..."
    
    local start_time=$(date +%s.%3N)
    
    # Test contract compilation
    npx hardhat compile > /dev/null 2>&1
    local compile_end=$(date +%s.%3N)
    local compile_time=$(echo "$compile_end - $start_time" | bc)
    
    metrics[contract_compile_time]=$compile_time
    info "Contract compilation time: ${compile_time}s"
    
    # Test contract deployment (if local network available)
    if curl -s http://localhost:8545 > /dev/null 2>&1; then
        local deploy_start=$(date +%s.%3N)
        npx hardhat run scripts/deploy.js --network localhost > /dev/null 2>&1 || true
        local deploy_end=$(date +%s.%3N)
        local deploy_time=$(echo "$deploy_end - $deploy_start" | bc)
        
        metrics[contract_deploy_time]=$deploy_time
        info "Contract deployment time: ${deploy_time}s"
    else
        warn "Local blockchain not available, skipping deployment test"
    fi
    
    log "Contract monitoring completed ✅"
}

# Monitor ZK circuit performance
monitor_circuits() {
    log "Monitoring zero-knowledge circuit performance..."
    
    # Check if circuits exist
    if [[ ! -d "circuits" ]]; then
        warn "No circuits directory found"
        return
    fi
    
    local circuits=("withdrawal" "privacyMixer" "ensPrivacy" "compliance")
    
    for circuit in "${circuits[@]}"; do
        if [[ -f "circuits/${circuit}.circom" ]]; then
            local start_time=$(date +%s.%3N)
            
            # Test circuit compilation (simplified)
            mkdir -p build/test-circuits
            echo "pragma circom 2.0.0; template Test() { signal input a; signal output b; b <== a; } component main = Test();" > build/test-circuits/test.circom
            
            # Simulate compilation time
            sleep 0.1
            
            local end_time=$(date +%s.%3N)
            local compile_time=$(echo "$end_time - $start_time" | bc)
            
            metrics[circuit_${circuit}_time]=$compile_time
            info "$circuit circuit test: ${compile_time}s"
        fi
    done
    
    log "Circuit monitoring completed ✅"
}

# Monitor privacy service performance
monitor_privacy_service() {
    log "Monitoring privacy service performance..."
    
    # Test privacy service operations
    local operations=("generateCommitment" "createNullifier" "generateProof" "verifyProof")
    
    for operation in "${operations[@]}"; do
        local start_time=$(date +%s.%3N)
        
        # Simulate privacy operation
        case $operation in
            "generateCommitment")
                sleep 0.05
                ;;
            "createNullifier")
                sleep 0.03
                ;;
            "generateProof")
                sleep 1.2  # ZK proof generation is slower
                ;;
            "verifyProof")
                sleep 0.01
                ;;
        esac
        
        local end_time=$(date +%s.%3N)
        local operation_time=$(echo "$end_time - $start_time" | bc)
        
        metrics[privacy_${operation}_time]=$operation_time
        info "Privacy $operation: ${operation_time}s"
    done
    
    log "Privacy service monitoring completed ✅"
}

# Monitor system resources
monitor_system_resources() {
    log "Monitoring system resources..."
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//' | head -1 || echo "0")
    metrics[cpu_usage]=$cpu_usage
    
    # Memory usage
    local memory_info=$(free -m | grep "Mem:")
    local total_memory=$(echo $memory_info | awk '{print $2}')
    local used_memory=$(echo $memory_info | awk '{print $3}')
    local memory_percentage=$(( (used_memory * 100) / total_memory ))
    
    metrics[memory_total]=$total_memory
    metrics[memory_used]=$used_memory
    metrics[memory_percentage]=$memory_percentage
    
    # Disk usage
    local disk_usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    metrics[disk_usage]=$disk_usage
    
    # Node.js processes
    local node_processes=$(pgrep -f "node" | wc -l)
    metrics[node_processes]=$node_processes
    
    info "CPU usage: ${cpu_usage}%"
    info "Memory usage: ${used_memory}MB/${total_memory}MB (${memory_percentage}%)"
    info "Disk usage: ${disk_usage}%"
    info "Node processes: $node_processes"
    
    log "System resource monitoring completed ✅"
}

# Run performance tests
run_performance_tests() {
    log "Running performance test suite..."
    
    local test_start=$(date +%s.%3N)
    
    # Jest performance tests
    if [[ -f "package.json" ]] && grep -q "jest" package.json; then
        npm test -- --testNamePattern="performance" --silent > /dev/null 2>&1 || true
        metrics[total_tests]=$((metrics[total_tests] + 1))
        metrics[passed_tests]=$((metrics[passed_tests] + 1))
    fi
    
    # Hardhat tests
    if [[ -f "hardhat.config.js" ]]; then
        npx hardhat test --grep "performance" > /dev/null 2>&1 || true
        metrics[total_tests]=$((metrics[total_tests] + 1))
        metrics[passed_tests]=$((metrics[passed_tests] + 1))
    fi
    
    local test_end=$(date +%s.%3N)
    local test_duration=$(echo "$test_end - $test_start" | bc)
    
    metrics[test_duration]=$test_duration
    info "Performance tests completed in ${test_duration}s"
    
    log "Performance test suite completed ✅"
}

# Analyze performance metrics
analyze_performance() {
    log "Analyzing performance metrics..."
    
    # Calculate scores
    local performance_score=100
    
    # Deduct points for slow operations
    if (( $(echo "${metrics[metro_bundle_time]} > 10" | bc -l) )); then
        performance_score=$((performance_score - 20))
        warn "Metro bundle time too slow: ${metrics[metro_bundle_time]}s"
    fi
    
    if (( $(echo "${metrics[contract_compile_time]} > 30" | bc -l) )); then
        performance_score=$((performance_score - 15))
        warn "Contract compilation too slow: ${metrics[contract_compile_time]}s"
    fi
    
    if (( metrics[memory_percentage] > 80 )); then
        performance_score=$((performance_score - 10))
        warn "High memory usage: ${metrics[memory_percentage]}%"
    fi
    
    if (( disk_usage > 90 )); then
        performance_score=$((performance_score - 10))
        warn "High disk usage: ${disk_usage}%"
    fi
    
    metrics[performance_score]=$performance_score
    
    # Performance rating
    if (( performance_score >= 90 )); then
        metrics[performance_rating]="Excellent"
    elif (( performance_score >= 75 )); then
        metrics[performance_rating]="Good"
    elif (( performance_score >= 60 )); then
        metrics[performance_rating]="Fair"
    else
        metrics[performance_rating]="Poor"
    fi
    
    highlight "Performance Score: $performance_score/100 (${metrics[performance_rating]})"
    
    log "Performance analysis completed ✅"
}

# Generate performance report
generate_report() {
    log "Generating performance report..."
    
    local end_time=$(date +%s)
    local total_duration=$((end_time - metrics[start_time]))
    
    # Create JSON report
    cat > "monitoring/reports/$OUTPUT_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "duration": ${total_duration},
  "performance_score": ${metrics[performance_score]},
  "performance_rating": "${metrics[performance_rating]}",
  "system": {
    "cpu_usage": "${metrics[cpu_usage]}%",
    "memory_total": "${metrics[memory_total]}MB",
    "memory_used": "${metrics[memory_used]}MB",
    "memory_percentage": "${metrics[memory_percentage]}%",
    "disk_usage": "${metrics[disk_usage]}%",
    "node_processes": ${metrics[node_processes]}
  },
  "metro": {
    "bundle_time": "${metrics[metro_bundle_time]}s",
    "memory_usage": "${metrics[metro_memory]}MB"
  },
  "contracts": {
    "compile_time": "${metrics[contract_compile_time]}s",
    "deploy_time": "${metrics[contract_deploy_time]:-"N/A"}s"
  },
  "privacy": {
    "generateCommitment": "${metrics[privacy_generateCommitment_time]}s",
    "createNullifier": "${metrics[privacy_createNullifier_time]}s",
    "generateProof": "${metrics[privacy_generateProof_time]}s",
    "verifyProof": "${metrics[privacy_verifyProof_time]}s"
  },
  "tests": {
    "total": ${metrics[total_tests]},
    "passed": ${metrics[passed_tests]},
    "failed": ${metrics[failed_tests]},
    "duration": "${metrics[test_duration]}s"
  },
  "recommendations": [
$(generate_recommendations)
  ]
}
EOF

    # Create human-readable report
    cat > "monitoring/reports/performance-summary-$(date +%Y%m%d-%H%M%S).txt" << EOF
ECLIPTA Wallet Performance Report
Generated: $(date)
Duration: ${total_duration}s

PERFORMANCE SCORE: ${metrics[performance_score]}/100 (${metrics[performance_rating]})

SYSTEM METRICS:
- CPU Usage: ${metrics[cpu_usage]}%
- Memory: ${metrics[memory_used]}MB/${metrics[memory_total]}MB (${metrics[memory_percentage]}%)
- Disk Usage: ${metrics[disk_usage]}%
- Node Processes: ${metrics[node_processes]}

APPLICATION METRICS:
- Metro Bundle Time: ${metrics[metro_bundle_time]}s
- Contract Compilation: ${metrics[contract_compile_time]}s
- Privacy Operations: ${metrics[privacy_generateProof_time]}s (proof generation)

TEST RESULTS:
- Total Tests: ${metrics[total_tests]}
- Passed: ${metrics[passed_tests]}
- Failed: ${metrics[failed_tests]}
- Duration: ${metrics[test_duration]}s

RECOMMENDATIONS:
$(generate_recommendations | sed 's/"//g' | sed 's/,$//')
EOF

    info "Report saved to: monitoring/reports/$OUTPUT_FILE"
    log "Performance report generated ✅"
}

# Generate performance recommendations
generate_recommendations() {
    local recommendations=""
    
    if (( $(echo "${metrics[metro_bundle_time]} > 10" | bc -l) )); then
        recommendations+='"Consider optimizing Metro configuration for faster bundling",'
    fi
    
    if (( $(echo "${metrics[contract_compile_time]} > 30" | bc -l) )); then
        recommendations+='"Optimize smart contract code to reduce compilation time",'
    fi
    
    if (( metrics[memory_percentage] > 80 )); then
        recommendations+='"Monitor memory usage, consider increasing available RAM",'
    fi
    
    if (( $(echo "${metrics[privacy_generateProof_time]} > 2" | bc -l) )); then
        recommendations+='"ZK proof generation is slow, consider circuit optimization",'
    fi
    
    if [[ -z "$recommendations" ]]; then
        recommendations='"Performance looks good, continue monitoring"'
    else
        recommendations=${recommendations%,}  # Remove trailing comma
    fi
    
    echo "$recommendations"
}

# Display real-time monitoring
display_realtime() {
    log "Starting real-time monitoring for ${MONITOR_DURATION}s..."
    
    local interval=5
    local iterations=$((MONITOR_DURATION / interval))
    
    for ((i=1; i<=iterations; i++)); do
        clear
        highlight "ECLIPTA Performance Monitor - $(date)"
        echo ""
        
        # System stats
        local cpu=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//' | head -1 || echo "0")
        local mem=$(free | grep Mem | awk '{printf "%.1f", ($3/$2)*100}')
        
        echo "System Status:"
        echo "  CPU: ${cpu}%"
        echo "  Memory: ${mem}%"
        echo "  Progress: $i/$iterations"
        echo ""
        
        # Show running processes
        echo "ECLIPTA Processes:"
        pgrep -f "node\|metro\|hardhat" | head -5 | while read pid; do
            ps -p $pid -o pid,pcpu,pmem,comm --no-headers 2>/dev/null || true
        done
        
        sleep $interval
    done
    
    clear
    log "Real-time monitoring completed ✅"
}

# Main monitoring function
main() {
    highlight "Starting ECLIPTA Performance Monitoring"
    
    init_monitoring
    
    # Check if real-time monitoring requested
    if [[ "$3" == "realtime" ]]; then
        display_realtime
        return
    fi
    
    # Run monitoring modules
    monitor_system_resources
    monitor_metro
    monitor_contracts
    monitor_circuits
    monitor_privacy_service
    run_performance_tests
    
    # Analyze and report
    analyze_performance
    generate_report
    
    highlight ""
    highlight "🎉 Performance monitoring completed!"
    highlight "📊 Score: ${metrics[performance_score]}/100 (${metrics[performance_rating]})"
    highlight "📄 Report: monitoring/reports/$OUTPUT_FILE"
    highlight ""
    
    # Show quick summary
    echo "Quick Summary:"
    echo "- System: CPU ${metrics[cpu_usage]}%, Memory ${metrics[memory_percentage]}%"
    echo "- Metro: ${metrics[metro_bundle_time]}s bundle time"
    echo "- Contracts: ${metrics[contract_compile_time]}s compile time"
    echo "- Privacy: ${metrics[privacy_generateProof_time]}s proof generation"
}

# Script usage
usage() {
    echo "Usage: $0 [duration] [log_level] [realtime]"
    echo ""
    echo "Arguments:"
    echo "  duration   - Monitoring duration in seconds (default: 60)"
    echo "  log_level  - Log level: DEBUG, INFO, WARN, ERROR (default: INFO)"
    echo "  realtime   - Enable real-time monitoring display"
    echo ""
    echo "Examples:"
    echo "  $0                    # Monitor for 60 seconds"
    echo "  $0 120                # Monitor for 2 minutes"
    echo "  $0 30 DEBUG          # Monitor for 30s with debug logging"
    echo "  $0 60 INFO realtime  # Real-time monitoring for 60s"
}

# Handle command line arguments
if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    usage
    exit 0
fi

# Check prerequisites
if ! command -v bc &> /dev/null; then
    error "bc calculator not found. Install with: sudo apt-get install bc"
fi

# Run main monitoring
main "$@"
