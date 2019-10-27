(() => {
    if (!window.modules) window.modules = {}

    window.modules.record = {
        open,
        close,
        record,
        stopRecording,
        play,
        stopPlaying,
        getDownloadUrl
    }

    let stream = null
    let mediaRecorder = null
    let context = new AudioContext()
    let audioBuffer = null
    let source = null

    async function open() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        }
        catch {
            return false
        }

        mediaRecorder = new MediaRecorder(stream)

        return true
    }

    function close() {
        stream.getTracks().forEach(track => track.stop())

        stream = null
        mediaRecorder = null
    }

    async function record() {
        mediaRecorder.start()

        let audioChunks = []

        mediaRecorder.addEventListener('dataavailable', ({ data }) => {
            audioChunks.push(data)
        })

        mediaRecorder.onstop = async () => {
            let blob = new Blob(audioChunks)

            // Convert blob to array buffer
            arrayBuffer = await new Response(blob).arrayBuffer()

            // Convert array buffer to audio and reverse it
            context.decodeAudioData(arrayBuffer, buffer => {
                audioBuffer = buffer
                audioBuffer.getChannelData(0).reverse()

                if (audioBuffer.numberOfChannels === 2) {
                    audioBuffer.getChannelData(1).reverse()
                }
            })
        }
    }

    function stopRecording() {
        mediaRecorder.stop()
    }

    function play(callback) {
        source = context.createBufferSource()
        source.buffer = audioBuffer
        source.connect(context.destination)
        source.onended = () => callback()
        source.start()
    }

    function stopPlaying() {
        source.stop()
    }

    function getDownloadUrl() {
        let offlineContext = new OfflineAudioContext({
            numberOfChannels: audioBuffer.numberOfChannels,
            length: 44100 * audioBuffer.duration,
            sampleRate: 44100,
        })

        let length = offlineContext.length * audioBuffer.numberOfChannels * 2 + 44
        let buffer = new ArrayBuffer(length)
        let view = new DataView(buffer)
        let channels = []

        let position = 0

        // Helper functions
        function setUint16(data) {
            view.setUint16(position, data, true)
            position += 2
        }

        function setUint32(data) {
            view.setUint32(position, data, true)
            position += 4
        }

        // "RIFF"
        setUint32(0x46464952)

        // File length - 8
        setUint32(length - 8)

        // "WAVE"
        setUint32(0x45564157)

        // "fmt" chunk
        setUint32(0x20746d66)

        // Length = 16
        setUint32(16)

        // PCM (uncompressed)
        setUint16(1)
        setUint16(audioBuffer.numberOfChannels)
        setUint32(audioBuffer.sampleRate)

        // Bytes/sec
        setUint32(audioBuffer.sampleRate * 2 * audioBuffer.numberOfChannels)

        // Block-align
        setUint16(audioBuffer.numberOfChannels * 2)

        // 16-bit
        setUint16(16)

        // "data" chunk
        setUint32(0x61746164)

        // Chunk length
        setUint32(length - position - 4)

        // Write interleaved data
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            channels.push(audioBuffer.getChannelData(i))
        }

        let offset = 0

        while (position < length) {
            // Interleave channels
            for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
                // Clamp
                let sample = Math.max(-1, Math.min(1, channels[i][offset]))

                // Scale to 16-bit signed int
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0

                // Write 16-bit sample
                view.setInt16(position, sample, true)
                position += 2
            }

            // Next source sample
            offset++
        }

        let blob = new Blob([buffer], { type: 'audio/wav' })
        return URL.createObjectURL(blob)
    }
})()