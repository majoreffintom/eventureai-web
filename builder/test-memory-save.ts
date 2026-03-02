import 'dotenv/config';
import { createSwarm } from './packages/llm/dist/index.js';

async function testMemorySave() {
  console.log('🧪 Starting Memory Save Test...');
  
  const swarm = createSwarm();
  const messages = [
    { role: 'user', content: 'This is a test message to verify record 11 is created in memory.' }
  ];

  console.log('📤 Sending test message to Swarm...');
  
  try {
    // We use chatStream which has our autosave logic
    await swarm.chatStream(messages, {
      stream: true,
      callbacks: {
        onContentBlockDelta: (index, text) => {
          process.stdout.write(text);
        },
        onMessageStop: () => {
          console.log('\n✅ Swarm execution complete.');
          console.log('⏳ Waiting for autosave to finish...');
          // Give it a second to complete the async save
          setTimeout(() => {
            console.log('\n🏁 Test finished. Run "npx tsx check-autosave.ts" to check for record 11.');
            process.exit(0);
          }, 2000);
        },
        onError: (err) => {
          console.error('\n❌ Swarm Error:', err);
          process.exit(1);
        }
      }
    });
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testMemorySave();
