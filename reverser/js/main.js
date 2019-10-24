onload = async () => {
    // Just a neat alias
    let $ = document.querySelector.bind(document)

    $('#reverse').onclick = () => {
        $('#output').textContent = modules.reverse.reversePhonetically($('#input').value)
    }

    $('#record').onclick = onRecordClick
    $('#play').onclick = onPlayClick
    $('#download').onclick = () => {
        let link = document.createElement('a')
        link.href = modules.record.getDownloadUrl()
        link.download = 'audio.wav'
        link.click()
    }

    async function onRecordClick() {
        let canRecord = await modules.record.open()

        if (!canRecord) {
            $('#record-init-error').style.display = 'block'
            $('#record').disabled = true
            return
        }

        modules.record.record()
        $('#play').disabled = true
        $('#download').disabled = true
        $('#record').onclick = onStopRecordingClick
        $('#record').textContent = 'Stop recording'
    }

    function onStopRecordingClick() {
        modules.record.close()
        modules.record.stopRecording()
        $('#play').disabled = false
        $('#download').disabled = false
        $('#record').onclick = onRecordClick
        $('#record').textContent = 'Record'
    }

    function onPlayClick() {
        modules.record.play(() => onStopClick())
        $('#record').disabled = true
        $('#play').onclick = onStopClick
        $('#play').textContent = 'Stop playing'
    }

    function onStopClick() {
        modules.record.stopPlaying()
        $('#record').disabled = false
        $('#play').onclick = onPlayClick
        $('#play').textContent = 'Play'
    }
}