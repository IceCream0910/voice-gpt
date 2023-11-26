"use client"
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import SpeechRecognitionComponent from './components/stt';
import { SettingsProvider } from './settings/SettingsContext';
import { useSettings } from './settings/SettingsContext';
import Link from 'next/link';
import IonIcon from '@reacticons/ionicons';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/filled-icon-button.js';
import '@material/web/iconbutton/filled-tonal-icon-button.js';
import '@material/web/iconbutton/outlined-icon-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/button/text-button.js';

const Home = React.forwardRef((props, ref) => {
  const { gpt4Enabled, naturalVoiceEnabled, guidePrompt, updateGuidePrompt } = useSettings();
  const [messages, setMessages] = useState([{ role: "system", content: "You're voice assistant. As possible you must answer simply and friendly. You can fix some typos of user input based on context." }]);

  const STT = useRef();
  const audio = useRef();

  useEffect(() => {
    console.log('gpt4Enabled, naturalVoiceEnabled:', gpt4Enabled, naturalVoiceEnabled);
  }, [gpt4Enabled, naturalVoiceEnabled])

  const onSpeechRecognitionResult = (result) => {
    if (result) {
      send([...messages, { role: "user", content: result }]);
      setMessages([...messages, { role: "user", content: result }]);
    }
  }

  async function send(msgs) {
    console.log(msgs);

    if (gpt4Enabled) {
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: msgs,
          model: "gpt-4-1106-preview",
          max_tokens: 128,
          temperature: 0.7,
          top_p: 1,
          stream: true,
        }),
      })
        .then((response) => {
          if (!response.body) {
            console.error("Response body is null");
            TTS('연결이 잠시 끊겼어요. 다시 한 번 말해줄래요?');
          }
          if (!response.ok) {
            console.error("response is not ok");
            TTS('연결이 잠시 끊겼어요. 다시 한 번 말해줄래요?');
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          async function readChunks() {
            let result = await reader.read();
            var resultMsg = "";
            let partialSentence = '';

            while (!result.done) {
              const data = decoder.decode(result.value, {
                stream: true,
              });
              const parsedData = data
                .replaceAll("data: ", "")
                .trim()
                .split("\n");
              let lastSentence = '';
              parsedData.forEach((item) => {
                if (data && isJson(item)) {
                  if (
                    JSON.parse(item).choices &&
                    JSON.parse(item).choices[0].delta &&
                    JSON.parse(item).choices[0].delta.content
                  ) {
                    const newContent = JSON.parse(item).choices[0].delta.content;
                    resultMsg += newContent;
                    partialSentence += newContent;

                    let sentenceCount = (partialSentence.match(/[.!?]/g) || []).length;
                    if (sentenceCount >= 1) {
                      TTS(partialSentence.trim());
                      partialSentence = '';
                    }
                  }
                }
              });
              result = await reader.read();
            }
            //done
            setMessages([...messages, { role: "assistant", content: resultMsg }]);
          }
          readChunks();
        })
        .catch((error) => {
          console.error(error);
          TTS('연결이 잠시 끊겼어요. 다시 한 번 말해줄래요?');
        })
    } else {
      fetch("https://api.openai.com/v1/chat/completions", {
        //GPT3.5
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: msgs,
          model: "gpt-3.5-turbo-1106",
          max_tokens: 128,
          temperature: 0.7,
          top_p: 1,
          stream: true,
        }),
      })
        .then((response) => {
          if (!response.body) {
            console.error("Response body is null");
            TTS('연결이 잠시 끊겼어요. 다시 한 번 말해줄래요?');
          }
          if (!response.ok) {
            console.error("response is not ok");
            TTS('연결이 잠시 끊겼어요. 다시 한 번 말해줄래요?');
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          async function readChunks() {
            let result = await reader.read();
            var resultMsg = "";
            let partialSentence = '';

            while (!result.done) {
              const data = decoder.decode(result.value, {
                stream: true,
              });
              const parsedData = data
                .replaceAll("data: ", "")
                .trim()
                .split("\n");
              let lastSentence = '';
              parsedData.forEach((item) => {
                if (data && isJson(item)) {
                  if (
                    JSON.parse(item).choices &&
                    JSON.parse(item).choices[0].delta &&
                    JSON.parse(item).choices[0].delta.content
                  ) {
                    const newContent = JSON.parse(item).choices[0].delta.content;
                    resultMsg += newContent;
                    partialSentence += newContent;

                    let sentenceCount = (partialSentence.match(/[.!?]/g) || []).length;
                    if (sentenceCount >= 1) {
                      TTS(partialSentence.trim());
                      partialSentence = '';
                    }
                  }
                }
              });
              result = await reader.read();
            }
            //done
            setMessages([...messages, { role: "assistant", content: resultMsg }]);
          }
          readChunks();
        })
        .catch((error) => {
          console.error(error);
          TTS('연결이 잠시 끊겼어요. 다시 한 번 말해줄래요?');
        })
    }
  }

  function isJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  let queue = [];
  let isPlaying = false;
  let audioCache = {};
  let audioIndex = 0;

  async function TTS(text) {
    if (text) {
      const index = queue.length;
      queue.push(text);
      if (naturalVoiceEnabled) {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer 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`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'model': 'tts-1',
            'input': text,
            'voice': 'echo'
          })
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        audioCache[index] = new Audio(url);
      } else {
        audioCache[index] = new Audio(`https://playentry.org/api/expansionBlock/tts/read.mp3?text=${encodeURIComponent(text)}&speaker=dinna`);
      }
      playAudio();
      updateGuidePrompt('말하는 중...');
    }
  }

  async function playAudio() {
    if (!isPlaying && queue.length > 0) {
      if (audioCache[audioIndex]) {
        audioCache[audioIndex].play();
        audioCache[audioIndex].onended = onTTSEnd;
        isPlaying = true;
      }
    }
  }

  function onTTSEnd() {
    var text = queue.shift();
    if (queue.length > 0) {
      audioIndex++;
      isPlaying = false;
      playAudio();
    } else {
      audioIndex = 0;
      isPlaying = false;
      STT.current.startListening()
    }
  }

  function startNewConversation() {
    setMessages([{ role: "system", content: "You're voice assistant. As possible you must answer simply and friendly. You can fix some typos of user input based on context." }]);
    STT.current.startListening();
  }

  return (
    <>
      <Link href="/settings" style={{ position: 'fixed', bottom: '40px', right: "20px" }}>
        <md-icon-button>
          <md-icon><IonIcon name='settings-outline' /></md-icon>
        </md-icon-button>
      </Link>

      <div onClick={() => startNewConversation()} style={{ position: 'fixed', bottom: '45px', left: "20px" }}>
        <md-text-button>
          <IonIcon name='add-circle-outline' style={{ fontSize: '30px', position: 'relative', top: '10px' }} />&nbsp;
          새 대화 시작
        </md-text-button>
      </div>

      <main className={styles.main}>
        <SpeechRecognitionComponent onResult={onSpeechRecognitionResult} ref={STT} />
        <p style={{ textAlign: 'center', width: '90vw', marginBottom: '10px' }}>{guidePrompt}</p>
      </main>
    </>
  )
});

export default Home;
