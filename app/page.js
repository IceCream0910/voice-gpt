"use client"
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import SpeechRecognition from './components/stt';

const Home = React.forwardRef((props, ref) => {
  const [sttResult, setSttResult] = useState('');
  const [messages, setMessages] = useState([{ role: "system", content: "You're voice assistant. As possible you must answer simply and friendly." }]);
  const [answer, setAnswer] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const STT = useRef();
  const audio = useRef();

  const onSpeechRecognitionResult = (result) => {
    if (result) {
      setSttResult(result);
      send([...messages, { role: "user", content: result }]);
      setMessages([...messages, { role: "user", content: result }]);
    }

  }

  const gptType = '3.5' // '4' or '3.5'
  async function send(msgs) {
    console.log(msgs);
    setAnswer('')

    if (gptType === '3.5') {
      fetch("https://ai.fakeopen.com/v1/chat/completions", {
        //GPT3.5
        method: "POST",
        headers: {
          Authorization: "Bearer pk-this-is-a-real-free-pool-token-for-everyone",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: msgs,
          model: "gpt-4",
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 1,
          stream: true,
        }),
      })
        .then((response) => {
          if (!response.body) {
            throw new Error("Response body is null");
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
                    if (sentenceCount >= 2) {
                      TTS(partialSentence.trim());
                      partialSentence = '';
                    }
                    setAnswer(resultMsg)
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
    } else if (gptType === '4') {

      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: msgs,
          model: "gpt-4-1106-preview",
          max_tokens: 1024,
          temperature: 0.6,
          top_p: 1,
          stream: true,
        }),
      })
        .then((response) => {
          if (!response.body) {
            throw new Error("Response body is null");
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
                    setAnswer(resultMsg)
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

  async function TTS(text) {
    console.log("tts:", text)
    if (text) {
      queue.push(text);
      playAudio();
    }
  }

  const apiType = 'clova' // 'openai' or 'clova'
  async function playAudio() {
    if (!isPlaying && queue.length > 0) {
      isPlaying = true;
      var text = queue.shift();
      if (!text) text = '연결이 잠시 끊겼어요. 다시 한 번 말해줄래요?';
      if (apiType === 'openai') {
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
        audio.current = new Audio(url);
        audio.current.play();
        audio.current.onended = onTTSEnd;
      } else if (apiType === 'clova') {
        const audio = new Audio(`https://playentry.org/api/expansionBlock/tts/read.mp3?text=${text}&speaker=dinna`);
        audio.play();
        audio.onended = onTTSEnd;
      }
    }
  }

  function onTTSEnd() {
    isPlaying = false;
    if (queue.length > 0) {
      playAudio();
    } else {
      setAnswer('')
      STT.current.startListening()
    }
  }

  return (
    <main className={styles.main}>
      <SpeechRecognition onResult={onSpeechRecognitionResult} ref={STT} />
    </main>
  )
});

export default Home;
