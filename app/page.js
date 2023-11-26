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
import '@material/web/button/outlined-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/button/text-button.js';
import Webcam from "react-webcam";

const Home = React.forwardRef((props, ref) => {
  const { gpt4Enabled, naturalVoiceEnabled, guidePrompt, updateGuidePrompt, freeGptEnabled } = useSettings();
  const messagesRef = useRef([{ role: "system", content: "You're voice assistant. As possible you must answer simply and friendly. You can fix some typos of user input based on context." }]);
  const [mode, setMode] = useState('text');
  const [webcamImage, setWebcamImage] = useState(null);
  const [canVision, setCanVision] = useState(false);

  const STT = useRef();
  const audio = useRef();
  const webcamRef = useRef(null);
  const previousImage = useRef(null);

  useEffect(() => {
    console.log('gpt4Enabled, naturalVoiceEnabled, freeGpt:', gpt4Enabled, naturalVoiceEnabled, freeGptEnabled);
    if (gpt4Enabled) setCanVision(true);
  }, [gpt4Enabled, naturalVoiceEnabled])

  const onSpeechRecognitionResult = (result) => {
    if (result) {
      if (mode === 'camera') {
        if (!webcamImage) {
          updateGuidePrompt('이미지를 업로드하지 못해 인식한 음성만 전송');
          messagesRef.current.push({ role: "user", content: result });
        }
        if (webcamImage && previousImage.current != webcamImage) { //이전 이미지와 다른 이미지일 경우에만 전송
          messagesRef.current.push({
            role: "user", content: [
              {
                type: "text",
                text: result
              },
              {
                type: "image_url",
                image_url: {
                  url: webcamImage,
                  detail: 'low'
                }
              }
            ]
          });
        } else {
          messagesRef.current.push({ role: "user", content: result });
        }
        previousImage.current = webcamImage;
      } else {
        messagesRef.current.push({ role: "user", content: result });
      }
      console.log("send", messagesRef.current);
      send(messagesRef.current);
    }
  }

  const onCaptureWebcam = () => {
    if (webcamRef.current && webcamImage === null) {
      const imageSrc = webcamRef.current.getScreenshot();
      setWebcamImage(imageSrc);
    }
  }

  async function send(msgs) {
    if (gpt4Enabled) {
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: msgs,
          model: "gpt-4-vision-preview",
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
            messagesRef.current.push({ role: "assistant", content: resultMsg });
            console.log("done", messagesRef.current);
          }
          readChunks();
        })
        .catch((error) => {
          console.error(error);
          TTS('연결이 잠시 끊겼어요. 다시 한 번 말해줄래요?');
        })
    } else {
      fetch(`${freeGptEnabled ? "https://ai.fakeopen.com/v1/chat/completions" : "https://api.openai.com/v1/chat/completions"}`, {
        //GPT3.5
        method: "POST",
        headers: {
          Authorization: `${freeGptEnabled ? "Bearer pk-this-is-a-real-free-pool-token-for-everyone" : "Bearer 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"}`,
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
            messagesRef.current.push({ role: "assistant", content: resultMsg });
            console.log("done", messagesRef.current);
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
    updateGuidePrompt('버튼을 눌러 새로운 주제로 말하기 시작');
    messagesRef.current = [{ role: "system", content: "You're voice assistant. As possible you must answer simply and friendly. You can fix some typos of user input based on context." }]
  }

  return (
    <>
      {(mode === 'camera' && canVision) &&
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            style={{ position: 'fixed', top: '0', left: '0', minWidth: '100%', minHeight: '100%', zIndex: '-1' }} />
          <div style={{ position: 'fixed', bottom: '0', left: '0', minWidth: '100%', minHeight: '50%', zIndex: '0', background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)' }} />

          <md-outlined-button className="bottom-btn"
            onClick={() => { setWebcamImage(webcamRef.current.getScreenshot()), updateGuidePrompt('지금 보고 있는 것에 대해 이야기해보세요'), STT.current.startListening() }}
            style={{ position: 'fixed', width: '60%', bottom: '90px', padding: '20px', boxSizing: 'border-box', height: '80px', transform: 'translateX(-50%)', left: '50%' }}
          >새로운 사진으로 대화</md-outlined-button>
        </>}

      <Link href="/settings" style={{ position: 'fixed', bottom: '40px', right: "20px", zIndex: '1' }}>
        <md-icon-button>
          <md-icon><IonIcon name='settings-outline' /></md-icon>
        </md-icon-button>
      </Link>

      {canVision && <div title="비전 모드" onClick={() => mode === 'camera' ? [setMode('text'), updateGuidePrompt('위 버튼을 눌러 말하기 시작')] : [setMode('camera'), updateGuidePrompt('아래 버튼을 눌러 눈앞의 장면에 대한 이야기 시작')]} style={{ position: 'fixed', bottom: '45px', left: "70px", zIndex: '1' }}>
        <md-text-button>
          <IonIcon name='aperture-outline' style={{ fontSize: '30px', position: 'relative', top: '10px' }} />&nbsp;
        </md-text-button>
      </div>}

      <div title="새 대화 시작" onClick={() => startNewConversation()} style={{ position: 'fixed', bottom: '45px', left: "20px", zIndex: '1' }}>
        <md-text-button>
          <IonIcon name='add-circle-outline' style={{ fontSize: '30px', position: 'relative', top: '10px' }} />&nbsp;
        </md-text-button>
      </div>

      <main className={styles.main}>
        <SpeechRecognitionComponent onResult={onSpeechRecognitionResult} onCaptureWebcam={onCaptureWebcam} ref={STT} mode={mode} />
        <p style={{ textAlign: 'center', width: '90vw', position: 'fixed', bottom: '30%' }}>{guidePrompt}</p>
      </main>
    </>
  )
});

export default Home;
