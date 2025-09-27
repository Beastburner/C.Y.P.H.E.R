import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface PrivacyEducationProps {
  onNavigate: (screen: string) => void;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  content: TutorialStep[];
}

interface TutorialStep {
  id: number;
  title: string;
  content: string;
  visual?: string;
  codeExample?: string;
  keyPoints: string[];
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
}

/**
 * @title PrivacyEducationSystem
 * @dev Interactive educational component for privacy features
 * @notice Provides comprehensive education about:
 *         - Zero-knowledge proofs fundamentals
 *         - Privacy best practices
 *         - Anonymity set concepts
 *         - Key management security
 *         - Smart contract privacy
 */
const PrivacyEducationSystem: React.FC<PrivacyEducationProps> = ({ onNavigate }) => {
  const { colors } = useTheme();
  
  // State management
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: number }>({});
  const [showQuizResult, setShowQuizResult] = useState(false);
  
  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Tutorial content
  const tutorials: Tutorial[] = [
    {
      id: 'zk-basics',
      title: 'Zero-Knowledge Proofs 101',
      description: 'Understanding the fundamentals of zero-knowledge cryptography',
      icon: 'science',
      difficulty: 'beginner',
      duration: '10 min',
      content: [
        {
          id: 1,
          title: 'What are Zero-Knowledge Proofs?',
          content: 'Zero-knowledge proofs allow you to prove you know something without revealing what you know. Imagine proving you know a secret password without saying the password.',
          visual: 'zk-concept',
          keyPoints: [
            'Prove knowledge without revealing information',
            'Maintains privacy while ensuring validity',
            'Used in blockchain for private transactions',
            'Three properties: Completeness, Soundness, Zero-knowledge'
          ],
          quiz: {
            question: 'What is the main benefit of zero-knowledge proofs?',
            options: [
              'They make transactions faster',
              'They prove knowledge without revealing secrets',
              'They reduce transaction fees',
              'They store more data'
            ],
            correctAnswer: 1,
            explanation: 'Zero-knowledge proofs allow verification of information without revealing the underlying data, preserving privacy.'
          }
        },
        {
          id: 2,
          title: 'How ZK Works in Practice',
          content: 'In our privacy system, zero-knowledge proofs verify that you own certain funds without revealing which funds or how much you have.',
          codeExample: `// Example: Proving ownership without revealing amount
const proof = await generateProof({
  secret: userSecret,      // Known only to you
  nullifier: nullifierHash, // Prevents double-spending
  commitment: commitment    // Public commitment
});

// Verifier can check proof validity without seeing secrets
const isValid = await verifyProof(proof, publicInputs);`,
          keyPoints: [
            'Prover generates cryptographic proof',
            'Verifier checks proof without seeing secrets',
            'Mathematical certainty without information leakage',
            'Used for private balance verification'
          ]
        },
        {
          id: 3,
          title: 'ZK in Your Wallet',
          content: 'When you make a shielded transaction, your wallet generates a zero-knowledge proof that demonstrates you have the right to spend the funds without revealing your balance or transaction history.',
          keyPoints: [
            'Wallet generates proofs locally',
            'Your secrets never leave your device',
            'Network verifies proofs automatically',
            'Privacy preserved throughout process'
          ],
          quiz: {
            question: 'Where are zero-knowledge proofs generated in your wallet?',
            options: [
              'On the blockchain network',
              'On remote servers',
              'Locally on your device',
              'By other users'
            ],
            correctAnswer: 2,
            explanation: 'Proofs are generated locally on your device to ensure your secrets never leave your control.'
          }
        }
      ]
    },
    {
      id: 'anonymity-sets',
      title: 'Understanding Anonymity Sets',
      description: 'Learn how anonymity sets protect your privacy',
      icon: 'group',
      difficulty: 'intermediate',
      duration: '8 min',
      content: [
        {
          id: 1,
          title: 'What is an Anonymity Set?',
          content: 'An anonymity set is the group of users among whom you are indistinguishable. The larger the set, the better your privacy protection.',
          visual: 'anonymity-concept',
          keyPoints: [
            'Group of indistinguishable users',
            'Larger sets provide better privacy',
            'Size affects plausible deniability',
            'Dynamic and changes over time'
          ]
        },
        {
          id: 2,
          title: 'Growing Your Anonymity Set',
          content: 'Your anonymity set grows as more users interact with the privacy pool. Strategic timing and amount selection can optimize your privacy.',
          keyPoints: [
            'More users = larger anonymity set',
            'Common amounts increase indistinguishability',
            'Peak usage times offer better mixing',
            'Wait for set growth when possible'
          ],
          quiz: {
            question: 'What makes for better privacy protection?',
            options: [
              'Smaller anonymity sets',
              'Unique transaction amounts',
              'Larger anonymity sets',
              'Off-peak timing'
            ],
            correctAnswer: 2,
            explanation: 'Larger anonymity sets mean more possible sources for any transaction, improving privacy.'
          }
        }
      ]
    },
    {
      id: 'best-practices',
      title: 'Privacy Best Practices',
      description: 'Essential habits for maintaining strong privacy',
      icon: 'security',
      difficulty: 'intermediate',
      duration: '12 min',
      content: [
        {
          id: 1,
          title: 'Transaction Timing',
          content: 'When you transact can significantly impact your privacy. Understanding optimal timing helps maximize your anonymity set.',
          keyPoints: [
            'Transact during peak hours for larger sets',
            'Avoid predictable patterns',
            'Wait for sufficient mixing time',
            'Consider time zone distributions'
          ]
        },
        {
          id: 2,
          title: 'Amount Selection Strategy',
          content: 'Using common denominations and avoiding unique amounts helps you blend in with other users.',
          keyPoints: [
            'Use round numbers when possible',
            'Avoid personally identifiable amounts',
            'Split large amounts into common denominations',
            'Consider fee implications'
          ]
        },
        {
          id: 3,
          title: 'Key Management',
          content: 'Proper key management is crucial for maintaining privacy over time.',
          keyPoints: [
            'Rotate keys periodically',
            'Use separate keys for different purposes',
            'Secure backup of all key material',
            'Never reuse nullifiers'
          ],
          quiz: {
            question: 'Why should you avoid unique transaction amounts?',
            options: [
              'They cost more in fees',
              'They make you identifiable',
              'They take longer to process',
              'They are less secure'
            ],
            correctAnswer: 1,
            explanation: 'Unique amounts make you stand out and reduce your anonymity set, compromising privacy.'
          }
        }
      ]
    },
    {
      id: 'advanced-concepts',
      title: 'Advanced Privacy Concepts',
      description: 'Deep dive into cryptographic primitives and advanced techniques',
      icon: 'psychology',
      difficulty: 'advanced',
      duration: '15 min',
      content: [
        {
          id: 1,
          title: 'Commitment Schemes',
          content: 'Cryptographic commitments allow you to commit to a value without revealing it, then later reveal the value with proof of the original commitment.',
          codeExample: `// Creating a commitment
const commitment = poseidon([amount, secret, nullifier]);

// Later revealing the commitment
const proof = {
  amount: amount,
  secret: secret,
  nullifier: nullifier
};

// Anyone can verify: poseidon([proof.amount, proof.secret, proof.nullifier]) == commitment`,
          keyPoints: [
            'Binding: Cannot change committed value',
            'Hiding: Value remains secret until revealed',
            'Used in zero-knowledge systems',
            'Enables private state commitments'
          ]
        },
        {
          id: 2,
          title: 'Merkle Trees in Privacy',
          content: 'Merkle trees allow efficient proof of membership in a set without revealing other set members.',
          keyPoints: [
            'Efficient membership proofs',
            'Logarithmic proof size',
            'Enables large anonymity sets',
            'Used in most privacy protocols'
          ]
        },
        {
          id: 3,
          title: 'Nullifier Systems',
          content: 'Nullifiers prevent double-spending in privacy systems while maintaining anonymity.',
          keyPoints: [
            'Unique per spending event',
            'Prevents double-spending',
            'Derived from secret information',
            'Publicly verifiable uniqueness'
          ],
          quiz: {
            question: 'What is the primary purpose of nullifiers?',
            options: [
              'To increase transaction speed',
              'To prevent double-spending',
              'To reduce fees',
              'To store metadata'
            ],
            correctAnswer: 1,
            explanation: 'Nullifiers ensure each note can only be spent once, preventing double-spending while maintaining privacy.'
          }
        }
      ]
    }
  ];

  // Animation helpers
  const animateStep = (direction: 'next' | 'prev') => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'next' ? -width : width,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNextStep = () => {
    if (selectedTutorial && currentStep < selectedTutorial.content.length - 1) {
      animateStep('next');
      setCurrentStep(currentStep + 1);
      setShowQuizResult(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      animateStep('prev');
      setCurrentStep(currentStep - 1);
      setShowQuizResult(false);
    }
  };

  const handleTutorialComplete = () => {
    if (selectedTutorial && !completedTutorials.includes(selectedTutorial.id)) {
      setCompletedTutorials([...completedTutorials, selectedTutorial.id]);
    }
    setSelectedTutorial(null);
    setCurrentStep(0);
    setQuizAnswers({});
    setShowQuizResult(false);
  };

  const handleQuizAnswer = (stepId: number, answerIndex: number) => {
    const key = `${selectedTutorial?.id}-${stepId}`;
    setQuizAnswers({ ...quizAnswers, [key]: answerIndex });
    setShowQuizResult(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.error;
      default: return colors.primary;
    }
  };

  const renderTutorialList = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('Privacy')}
          >
            <Icon name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Education</Text>
          <View style={styles.placeholder} />
        </View>
        
        <Text style={styles.headerSubtitle}>
          Master privacy concepts and best practices
        </Text>
      </LinearGradient>

      {/* Progress Overview */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Icon name="school" size={24} color={colors.primary} />
          <Text style={styles.progressTitle}>Your Progress</Text>
        </View>
        
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressValue}>{completedTutorials.length}</Text>
            <Text style={styles.progressLabel}>Completed</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressValue}>{tutorials.length}</Text>
            <Text style={styles.progressLabel}>Total</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressValue}>
              {Math.round((completedTutorials.length / tutorials.length) * 100)}%
            </Text>
            <Text style={styles.progressLabel}>Progress</Text>
          </View>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { width: `${(completedTutorials.length / tutorials.length) * 100}%` }
          ]} />
        </View>
      </View>

      {/* Tutorial Cards */}
      <View style={styles.tutorialsSection}>
        <Text style={styles.sectionTitle}>Available Tutorials</Text>
        
        {tutorials.map((tutorial) => (
          <TouchableOpacity
            key={tutorial.id}
            style={styles.tutorialCard}
            onPress={() => setSelectedTutorial(tutorial)}
          >
            <View style={styles.tutorialCardHeader}>
              <View style={styles.tutorialIcon}>
                <Icon name={tutorial.icon} size={24} color={colors.primary} />
              </View>
              
              <View style={styles.tutorialInfo}>
                <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                <Text style={styles.tutorialDescription}>{tutorial.description}</Text>
              </View>
              
              {completedTutorials.includes(tutorial.id) && (
                <Icon name="check-circle" size={24} color={colors.success} />
              )}
            </View>
            
            <View style={styles.tutorialMeta}>
              <View style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(tutorial.difficulty) }
              ]}>
                <Text style={styles.difficultyText}>
                  {tutorial.difficulty.charAt(0).toUpperCase() + tutorial.difficulty.slice(1)}
                </Text>
              </View>
              
              <View style={styles.durationBadge}>
                <Icon name="schedule" size={14} color={colors.textSecondary} />
                <Text style={styles.durationText}>{tutorial.duration}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.sectionTitle}>Quick Privacy Tips</Text>
        
        <View style={styles.tip}>
          <Icon name="lightbulb-outline" size={20} color={colors.accent} />
          <Text style={styles.tipText}>
            Use common transaction amounts to blend in with other users
          </Text>
        </View>
        
        <View style={styles.tip}>
          <Icon name="schedule" size={20} color={colors.accent} />
          <Text style={styles.tipText}>
            Transact during peak hours for better anonymity sets
          </Text>
        </View>
        
        <View style={styles.tip}>
          <Icon name="security" size={20} color={colors.accent} />
          <Text style={styles.tipText}>
            Rotate your keys periodically for enhanced security
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderTutorial = () => {
    if (!selectedTutorial) return null;
    
    const currentStepData = selectedTutorial.content[currentStep];
    const isLastStep = currentStep === selectedTutorial.content.length - 1;
    
    return (
      <View style={styles.tutorialContainer}>
        {/* Tutorial Header */}
        <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.tutorialHeader}>
          <View style={styles.tutorialHeaderContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setSelectedTutorial(null)}
            >
              <Icon name="close" size={20} color="white" />
            </TouchableOpacity>
            <Text style={styles.tutorialHeaderTitle}>{selectedTutorial.title}</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>
              Step {currentStep + 1} of {selectedTutorial.content.length}
            </Text>
            <View style={styles.stepProgress}>
              <View style={[
                styles.stepProgressFill,
                { width: `${((currentStep + 1) / selectedTutorial.content.length) * 100}%` }
              ]} />
            </View>
          </View>
        </LinearGradient>

        {/* Tutorial Content */}
        <Animated.View 
          style={[
            styles.tutorialContent,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepContent}>{currentStepData.content}</Text>
            
            {/* Code Example */}
            {currentStepData.codeExample && (
              <View style={styles.codeBlock}>
                <Text style={styles.codeTitle}>Example Code:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={styles.codeText}>{currentStepData.codeExample}</Text>
                </ScrollView>
              </View>
            )}
            
            {/* Key Points */}
            <View style={styles.keyPoints}>
              <Text style={styles.keyPointsTitle}>Key Points:</Text>
              {currentStepData.keyPoints.map((point, index) => (
                <View key={index} style={styles.keyPoint}>
                  <Icon name="check" size={16} color={colors.success} />
                  <Text style={styles.keyPointText}>{point}</Text>
                </View>
              ))}
            </View>
            
            {/* Quiz */}
            {currentStepData.quiz && (
              <View style={styles.quizSection}>
                <Text style={styles.quizTitle}>Quick Check:</Text>
                <Text style={styles.quizQuestion}>{currentStepData.quiz.question}</Text>
                
                {currentStepData.quiz.options.map((option, index) => {
                  const isSelected = quizAnswers[`${selectedTutorial.id}-${currentStepData.id}`] === index;
                  const isCorrect = index === currentStepData.quiz!.correctAnswer;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.quizOption,
                        isSelected && (isCorrect ? styles.correctOption : styles.incorrectOption),
                        showQuizResult && isCorrect && styles.correctOption
                      ]}
                      onPress={() => !showQuizResult && handleQuizAnswer(currentStepData.id, index)}
                      disabled={showQuizResult}
                    >
                      <Text style={[
                        styles.quizOptionText,
                        isSelected && styles.selectedOptionText
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                
                {showQuizResult && (
                  <View style={styles.quizResult}>
                    <Text style={styles.quizExplanation}>
                      {currentStepData.quiz.explanation}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {/* Navigation */}
        <View style={styles.tutorialNavigation}>
          <TouchableOpacity
            style={[styles.navButton, currentStep === 0 && styles.disabledButton]}
            onPress={handlePrevStep}
            disabled={currentStep === 0}
          >
            <Icon name="arrow-back" size={20} color={currentStep === 0 ? colors.textSecondary : colors.primary} />
            <Text style={[
              styles.navButtonText,
              currentStep === 0 && styles.disabledButtonText
            ]}>
              Previous
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navButton, styles.primaryButton]}
            onPress={isLastStep ? handleTutorialComplete : handleNextStep}
          >
            <Text style={styles.primaryButtonText}>
              {isLastStep ? 'Complete' : 'Next'}
            </Text>
            <Icon 
              name={isLastStep ? "check" : "arrow-forward"} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = createStyles(colors);

  return selectedTutorial ? renderTutorial() : renderTutorialList();
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  progressCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  tutorialsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  tutorialCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tutorialCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tutorialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tutorialInfo: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  tutorialDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tutorialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  tipsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  tutorialContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tutorialHeader: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  tutorialHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tutorialHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  stepIndicator: {
    paddingHorizontal: 16,
  },
  stepText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  stepProgress: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  stepProgressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  tutorialContent: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  stepContent: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  codeBlock: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  codeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  keyPoints: {
    marginBottom: 20,
  },
  keyPointsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    lineHeight: 20,
  },
  quizSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  quizQuestion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  quizOption: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  correctOption: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  incorrectOption: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
  quizOptionText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: 'white',
  },
  quizResult: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  quizExplanation: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  tutorialNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  disabledButtonText: {
    color: colors.textSecondary,
  },
});

export default PrivacyEducationSystem;
