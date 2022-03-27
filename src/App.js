import React, { useState } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import './App.css';

async function processVideo({ ffmpeg, startTime, chuckSize, fileName, fileExt }) {
  const trimedName = 'trimmed.' + fileExt;
  const fadedName = 'faded.' + fileExt;

  await ffmpeg.run(
    '-ss', `00:00:0${startTime}`,
    '-to', `00:00:0${startTime + chuckSize}`,
    '-i', fileName,
    // '-vf', 'fade=t=in:st=0:d=1',
    '-c', 'copy', trimedName
  );
  await ffmpeg.run('-i', trimedName, '-vf', `fade=t=in:st=0:d=0.5,fade=t=out:st=${chuckSize - 0.5}:d=0.5`, '-c:a', 'copy', fadedName);
  const data = ffmpeg.FS('readFile', fadedName);

  return URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
}

function App() {
  const [video, setVideo] = useState('');
  const [rawVideoSrc, setRawVideoSrc] = useState('');
  const [message, setMessage] = useState('Click Start to transcode');
  const [videoSrcChunks, setVideoSrcChunks] = useState([]);
  const ffmpeg = createFFmpeg({
    log: true,
    corePath: '/ffmpeg-core.js'
  });

  const doTranscode = async () => {
    const fileName = video.name;
    const fileExt = fileName.split('.').pop();

    console.log('[x] videoName', fileName, video);
    setMessage('Loading ffmpeg-core.js');
    await ffmpeg.load();
    setMessage('Start transcoding');
    ffmpeg.FS('writeFile', fileName, await fetchFile(video));
    const chunks = [];
    const len = 5;
    let startTime = 0;
    for (let i = 0; i < len; i ++) {
      setMessage(`Progress: ${i + 1}/${len}`);
      chunks.push(await processVideo({
        fileName,
        fileExt,
        startTime,
        chuckSize: 3,
        ffmpeg,
      }));
      startTime += 3;
    }
    setMessage('Complete transcoding');
    setVideoSrcChunks(chunks);
  };

  return (
    <div className="App">
      <p/>
      { rawVideoSrc && <video width="400" src={rawVideoSrc} controls></video> }
      <br/> 
      <input type="file" onChange={(e) => {
        const file = e.target.files?.item(0);
        setRawVideoSrc(URL.createObjectURL(file));
        setVideo(file);
      }} />
      <br/>
      { video && <button onClick={doTranscode}>Start</button> }
      <p>{message}</p>
      <br/>
      { videoSrcChunks.map((src, index) => <video key={index} width="250" src={src} controls></video>) }
    </div>
  );
}

export default App;
