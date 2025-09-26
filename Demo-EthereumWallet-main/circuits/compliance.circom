pragma circom 2.0.0;

/*
 * Compliance Circuit for Privacy Pools
 * 
 * This circuit enables compliance checks while preserving privacy
 * It allows proving that transactions comply with regulations without
 * revealing transaction details
 */

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

template ComplianceCheck() {
    // === PRIVATE INPUTS ===
    signal private input userAddress;
    signal private input transactionAmount;
    signal private input sourceOfFunds; // Hash representing fund source
    signal private input transactionPurpose; // Hash representing purpose
    signal private input userKYCLevel; // 0=none, 1=basic, 2=full
    signal private input userRiskScore; // 0-100 risk score
    signal private input userJurisdiction; // Hash of jurisdiction
    signal private input historicalVolume[30]; // Last 30 days volume
    
    // === PUBLIC INPUTS ===
    signal input maxTransactionAmount;
    signal input maxDailyVolume;
    signal input maxMonthlyVolume;
    signal input requiredKYCLevel;
    signal input maxRiskScore;
    signal input allowedJurisdictions[20]; // List of allowed jurisdictions
    signal input complianceTimestamp;
    signal input regulatorKey; // Public key of regulator for verification
    
    // === OUTPUTS ===
    signal output isCompliant; // 1 if compliant, 0 otherwise
    signal output complianceProof;
    signal output riskAssessment;
    
    // === COMPLIANCE CHECKS ===
    
    // 1. Transaction amount check
    component amountCheck = LessEqThan(64);
    amountCheck.in[0] <== transactionAmount;
    amountCheck.in[1] <== maxTransactionAmount;
    
    // 2. KYC level check
    component kycCheck = GreaterEqThan(8);
    kycCheck.in[0] <== userKYCLevel;
    kycCheck.in[1] <== requiredKYCLevel;
    
    // 3. Risk score check
    component riskCheck = LessEqThan(8);
    riskCheck.in[0] <== userRiskScore;
    riskCheck.in[1] <== maxRiskScore;
    
    // 4. Jurisdiction check
    component jurisdictionChecker = CheckJurisdiction(20);
    jurisdictionChecker.userJurisdiction <== userJurisdiction;
    for (var i = 0; i < 20; i++) {
        jurisdictionChecker.allowedJurisdictions[i] <== allowedJurisdictions[i];
    }
    
    // 5. Daily volume check
    component dailyVolumeCheck = CheckDailyVolume(7);
    for (var i = 0; i < 7; i++) {
        dailyVolumeCheck.recentVolume[i] <== historicalVolume[i];
    }
    dailyVolumeCheck.newAmount <== transactionAmount;
    dailyVolumeCheck.maxDaily <== maxDailyVolume;
    
    // 6. Monthly volume check
    component monthlyVolumeCheck = CheckMonthlyVolume(30);
    for (var i = 0; i < 30; i++) {
        monthlyVolumeCheck.historicalVolume[i] <== historicalVolume[i];
    }
    monthlyVolumeCheck.newAmount <== transactionAmount;
    monthlyVolumeCheck.maxMonthly <== maxMonthlyVolume;
    
    // 7. Combine all compliance checks
    signal intermediateCompliance1;
    signal intermediateCompliance2;
    signal intermediateCompliance3;
    
    intermediateCompliance1 <== amountCheck.out * kycCheck.out;
    intermediateCompliance2 <== intermediateCompliance1 * riskCheck.out;
    intermediateCompliance3 <== intermediateCompliance2 * jurisdictionChecker.out;
    
    signal volumeCompliance;
    volumeCompliance <== dailyVolumeCheck.out * monthlyVolumeCheck.out;
    
    isCompliant <== intermediateCompliance3 * volumeCompliance;
    
    // 8. Generate compliance proof for regulators
    component complianceHasher = Poseidon(8);
    complianceHasher.inputs[0] <== userAddress;
    complianceHasher.inputs[1] <== transactionAmount;
    complianceHasher.inputs[2] <== userKYCLevel;
    complianceHasher.inputs[3] <== userRiskScore;
    complianceHasher.inputs[4] <== userJurisdiction;
    complianceHasher.inputs[5] <== complianceTimestamp;
    complianceHasher.inputs[6] <== isCompliant;
    complianceHasher.inputs[7] <== regulatorKey;
    
    complianceProof <== complianceHasher.out;
    
    // 9. Generate risk assessment
    component riskHasher = Poseidon(3);
    riskHasher.inputs[0] <== userRiskScore;
    riskHasher.inputs[1] <== transactionAmount;
    riskHasher.inputs[2] <== sourceOfFunds;
    
    riskAssessment <== riskHasher.out;
}

/*
 * Helper: Check if user jurisdiction is allowed
 */
template CheckJurisdiction(n) {
    signal input userJurisdiction;
    signal input allowedJurisdictions[n];
    signal output out;
    
    component equalCheckers[n];
    signal partialResults[n + 1];
    partialResults[0] <== 0;
    
    for (var i = 0; i < n; i++) {
        equalCheckers[i] = IsEqual();
        equalCheckers[i].in[0] <== userJurisdiction;
        equalCheckers[i].in[1] <== allowedJurisdictions[i];
        
        partialResults[i + 1] <== partialResults[i] + equalCheckers[i].out;
    }
    
    // Convert to boolean
    component finalCheck = IsZero();
    finalCheck.in <== partialResults[n];
    out <== 1 - finalCheck.out;
}

/*
 * Helper: Check daily volume limits
 */
template CheckDailyVolume(days) {
    signal input recentVolume[days];
    signal input newAmount;
    signal input maxDaily;
    signal output out;
    
    component summer = CalculateVolumeSum(days);
    for (var i = 0; i < days; i++) {
        summer.in[i] <== recentVolume[i];
    }
    
    signal totalDailyVolume;
    totalDailyVolume <== summer.out + newAmount;
    
    component volumeCheck = LessEqThan(64);
    volumeCheck.in[0] <== totalDailyVolume;
    volumeCheck.in[1] <== maxDaily;
    
    out <== volumeCheck.out;
}

/*
 * Helper: Check monthly volume limits
 */
template CheckMonthlyVolume(days) {
    signal input historicalVolume[days];
    signal input newAmount;
    signal input maxMonthly;
    signal output out;
    
    component summer = CalculateVolumeSum(days);
    for (var i = 0; i < days; i++) {
        summer.in[i] <== historicalVolume[i];
    }
    
    signal totalMonthlyVolume;
    totalMonthlyVolume <== summer.out + newAmount;
    
    component volumeCheck = LessEqThan(64);
    volumeCheck.in[0] <== totalMonthlyVolume;
    volumeCheck.in[1] <== maxMonthly;
    
    out <== volumeCheck.out;
}

/*
 * Helper: Calculate sum of volume array
 */
template CalculateVolumeSum(n) {
    signal input in[n];
    signal output out;
    
    if (n == 1) {
        out <== in[0];
    } else {
        component partial = CalculateVolumeSum(n - 1);
        for (var i = 0; i < n - 1; i++) {
            partial.in[i] <== in[i];
        }
        out <== partial.out + in[n - 1];
    }
}

/*
 * OFAC Sanctions Check Circuit
 * 
 * Checks if addresses are on sanctions lists without revealing the check
 */
template SanctionsCheck() {
    signal private input userAddress;
    signal private input sanctionsList[1000]; // OFAC sanctions list (hashed)
    
    signal input sanctionsRoot; // Merkle root of sanctions list
    signal input timestamp;
    
    signal output isClean; // 1 if not sanctioned, 0 if sanctioned
    signal output sanctionsProof;
    
    // Check if user address is NOT in sanctions list
    component sanctionsChecker = CheckNotInList(1000);
    sanctionsChecker.target <== userAddress;
    for (var i = 0; i < 1000; i++) {
        sanctionsChecker.list[i] <== sanctionsList[i];
    }
    
    isClean <== sanctionsChecker.out;
    
    // Generate proof of sanctions check
    component proofHasher = Poseidon(3);
    proofHasher.inputs[0] <== userAddress;
    proofHasher.inputs[1] <== sanctionsRoot;
    proofHasher.inputs[2] <== timestamp;
    
    sanctionsProof <== proofHasher.out;
}

/*
 * Helper: Check if target is NOT in list
 */
template CheckNotInList(n) {
    signal input target;
    signal input list[n];
    signal output out;
    
    component equalCheckers[n];
    signal partialResults[n + 1];
    partialResults[0] <== 0;
    
    for (var i = 0; i < n; i++) {
        equalCheckers[i] = IsEqual();
        equalCheckers[i].in[0] <== target;
        equalCheckers[i].in[1] <== list[i];
        
        partialResults[i + 1] <== partialResults[i] + equalCheckers[i].out;
    }
    
    // If found in list, result is 0 (not clean)
    component finalCheck = IsZero();
    finalCheck.in <== partialResults[n];
    out <== finalCheck.out; // 1 if not found (clean), 0 if found (sanctioned)
}

// Instantiate main component
component main = ComplianceCheck();
