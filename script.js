document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const themeToggle = document.getElementById('themeToggle');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const historyBtn = document.getElementById('historyBtn');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const historySidebar = document.getElementById('historySidebar');
    const historyList = document.querySelector('.history-list');
    
    // Theme Toggle
    themeToggle.addEventListener('click', function() {
        document.body.setAttribute('data-theme', 
            document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        
        const icon = this.querySelector('i');
        if (document.body.getAttribute('data-theme') === 'dark') {
            this.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        } else {
            this.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        }
        
        // Save theme preference to localStorage
        localStorage.setItem('theme', document.body.getAttribute('data-theme'));
    });
    
    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    }
    
    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabBtns.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Footer tab links
    document.querySelectorAll('.tab-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabBtns.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to corresponding button and content
            document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // History Sidebar
    historyBtn.addEventListener('click', function() {
        historySidebar.classList.add('open');
        loadHistory();
    });
    
    closeHistoryBtn.addEventListener('click', function() {
        historySidebar.classList.remove('open');
    });
    
    // Load history from localStorage
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('voiceGeniusHistory')) || [];
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<p>No history items yet.</p>';
            return;
        }
        
        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <h4>${item.type === 'tts' ? 'Text-to-Speech' : 'Speech-to-Text'}</h4>
                <p>${item.text.length > 100 ? item.text.substring(0, 100) + '...' : item.text}</p>
                <small>${new Date(item.timestamp).toLocaleString()}</small>
            `;
            
            historyItem.addEventListener('click', function() {
                if (item.type === 'tts') {
                    // Switch to TTS tab and populate data
                    document.querySelector('.tab-btn[data-tab="tts-tab"]').click();
                    document.getElementById('ttsText').value = item.text;
                    
                    // Restore settings if available
                    if (item.settings) {
                        document.getElementById('voiceSelect').value = item.settings.voice || '';
                        document.getElementById('emotionSelect').value = item.settings.emotion || 'neutral';
                        document.getElementById('rate').value = item.settings.rate || 1;
                        document.getElementById('pitch').value = item.settings.pitch || 1;
                        document.getElementById('volume').value = item.settings.volume || 1;
                        document.getElementById('rateValue').textContent = item.settings.rate || 1;
                        document.getElementById('pitchValue').textContent = item.settings.pitch || 1;
                        document.getElementById('volumeValue').textContent = item.settings.volume || 1;
                    }
                } else {
                    // Switch to STT tab and populate data
                    document.querySelector('.tab-btn[data-tab="stt-tab"]').click();
                    document.getElementById('transcribedText').value = item.text;
                }
                
                historySidebar.classList.remove('open');
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    // Save to history
    function saveToHistory(type, text, settings = null) {
        const history = JSON.parse(localStorage.getItem('voiceGeniusHistory')) || [];
        
        // Limit history to 50 items
        if (history.length >= 50) {
            history.shift();
        }
        
        history.push({
            type,
            text,
            settings,
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('voiceGeniusHistory', JSON.stringify(history));
    }
    
    // Initialize TTS functionality
    initTTS();
    
    // Initialize STT functionality
    initSTT();
    
    // Initialize Interactive Story
    initInteractiveStory();
});

// Text-to-Speech Functionality
function initTTS() {
    // DOM Elements
    const ttsText = document.getElementById('ttsText');
    const voiceSelect = document.getElementById('voiceSelect');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const stopBtn = document.getElementById('stopBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const rateSlider = document.getElementById('rate');
    const pitchSlider = document.getElementById('pitch');
    const volumeSlider = document.getElementById('volume');
    const rateValue = document.getElementById('rateValue');
    const pitchValue = document.getElementById('pitchValue');
    const volumeValue = document.getElementById('volumeValue');
    const emotionSelect = document.getElementById('emotionSelect');
    const previewBtn = document.getElementById('previewBtn');
    const formatBtns = document.querySelectorAll('.format-btn');
    const translateBtn = document.getElementById('translateBtn');
    const translatedText = document.getElementById('translatedText');
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');
    const nasalitySlider = document.getElementById('nasality');
    const breathinessSlider = document.getElementById('breathiness');
    const roughnessSlider = document.getElementById('roughness');
    const nasalityValue = document.getElementById('nasalityValue');
    const breathinessValue = document.getElementById('breathinessValue');
    const roughnessValue = document.getElementById('roughnessValue');
    const saveVoiceBtn = document.getElementById('saveVoiceBtn');
    
    // Speech synthesis variables
    let speechSynthesis = window.speechSynthesis;
    let utterance = null;
    let voices = [];
    let audioContext;
    let mediaRecorder;
    let audioChunks = [];
    let isPlaying = false;
    
    // Initialize voices
    function loadVoices() {
        voices = speechSynthesis.getVoices();
        voiceSelect.innerHTML = '';
        
        // Filter voices by language (optional) and add to select
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.voiceURI;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
        
        // Load custom voices from localStorage
        loadCustomVoices();
    }
    
    // Load custom voices from localStorage
    function loadCustomVoices() {
        const customVoices = JSON.parse(localStorage.getItem('customVoices')) || [];
        
        customVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = `custom-${index}`;
            option.textContent = `Custom Voice ${index + 1}`;
            voiceSelect.appendChild(option);
        });
    }
    
    // Event listener for voices changed
    speechSynthesis.onvoiceschanged = loadVoices;
    
    // Initial load
    loadVoices();
    
    // Update slider value displays
    rateSlider.addEventListener('input', function() {
        rateValue.textContent = this.value;
    });
    
    pitchSlider.addEventListener('input', function() {
        pitchValue.textContent = this.value;
    });
    
    volumeSlider.addEventListener('input', function() {
        volumeValue.textContent = this.value;
    });
    
    nasalitySlider.addEventListener('input', function() {
        nasalityValue.textContent = this.value;
    });
    
    breathinessSlider.addEventListener('input', function() {
        breathinessValue.textContent = this.value;
    });
    
    roughnessSlider.addEventListener('input', function() {
        roughnessValue.textContent = this.value;
    });
    
    // Text formatting
    formatBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const format = this.getAttribute('data-format');
            const startPos = ttsText.selectionStart;
            const endPos = ttsText.selectionEnd;
            const selectedText = ttsText.value.substring(startPos, endPos);
            
            if (!selectedText) return;
            
            let formattedText = '';
            
            switch (format) {
                case 'bold':
                    formattedText = `**${selectedText}**`;
                    break;
                case 'italic':
                    formattedText = `*${selectedText}*`;
                    break;
                case 'underline':
                    formattedText = `_${selectedText}_`;
                    break;
            }
            
            ttsText.value = ttsText.value.substring(0, startPos) + formattedText + ttsText.value.substring(endPos);
            
            // Restore selection
            ttsText.setSelectionRange(startPos, startPos + formattedText.length);
        });
    });
    
    // Apply emotion settings
    function applyEmotion(emotion) {
        switch (emotion) {
            case 'happy':
                pitchSlider.value = 1.3;
                rateSlider.value = 1.2;
                volumeSlider.value = 1;
                break;
            case 'sad':
                pitchSlider.value = 0.8;
                rateSlider.value = 0.7;
                volumeSlider.value = 0.9;
                break;
            case 'angry':
                pitchSlider.value = 1.1;
                rateSlider.value = 1.4;
                volumeSlider.value = 1.2;
                break;
            case 'excited':
                pitchSlider.value = 1.4;
                rateSlider.value = 1.5;
                volumeSlider.value = 1.1;
                break;
            default: // neutral
                pitchSlider.value = 1;
                rateSlider.value = 1;
                volumeSlider.value = 1;
        }
        
        // Update displayed values
        pitchValue.textContent = pitchSlider.value;
        rateValue.textContent = rateSlider.value;
        volumeValue.textContent = volumeSlider.value;
    }
    
    emotionSelect.addEventListener('change', function() {
        applyEmotion(this.value);
    });
    
    // Preview voice
    previewBtn.addEventListener('click', function() {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
        const previewText = "This is a preview of the selected voice.";
        const previewUtterance = new SpeechSynthesisUtterance(previewText);
        
        // Apply current voice and settings
        const selectedVoice = voices.find(voice => voice.voiceURI === voiceSelect.value);
        if (selectedVoice) {
            previewUtterance.voice = selectedVoice;
        }
        
        previewUtterance.rate = parseFloat(rateSlider.value);
        previewUtterance.pitch = parseFloat(pitchSlider.value);
        previewUtterance.volume = parseFloat(volumeSlider.value);
        
        speechSynthesis.speak(previewUtterance);
    });
    
    // Play TTS
    playBtn.addEventListener('click', function() {
        const text = translatedText.value || ttsText.value;
        if (!text.trim()) {
            alert('Please enter some text first.');
            return;
        }
        
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
        utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice
        const selectedVoice = voices.find(voice => voice.voiceURI === voiceSelect.value);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        // Apply settings
        utterance.rate = parseFloat(rateSlider.value);
        utterance.pitch = parseFloat(pitchSlider.value);
        utterance.volume = parseFloat(volumeSlider.value);
        
        // Event listeners
        utterance.onstart = function() {
            isPlaying = true;
            playBtn.disabled = true;
            pauseBtn.disabled = false;
            resumeBtn.disabled = true;
            stopBtn.disabled = false;
        };
        
        utterance.onend = function() {
            isPlaying = false;
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            resumeBtn.disabled = true;
            stopBtn.disabled = true;
            
            // Save to history
            saveToHistory('tts', text, {
                voice: voiceSelect.value,
                emotion: emotionSelect.value,
                rate: rateSlider.value,
                pitch: pitchSlider.value,
                volume: volumeSlider.value
            });
        };
        
        utterance.onpause = function() {
            isPlaying = false;
            pauseBtn.disabled = true;
            resumeBtn.disabled = false;
        };
        
        utterance.onresume = function() {
            isPlaying = true;
            pauseBtn.disabled = false;
            resumeBtn.disabled = true;
        };
        
        speechSynthesis.speak(utterance);
    });
    
    // Pause TTS
    pauseBtn.addEventListener('click', function() {
        if (speechSynthesis.speaking) {
            speechSynthesis.pause();
        }
    });
    
    // Resume TTS
    resumeBtn.addEventListener('click', function() {
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
        }
    });
    
    // Stop TTS
    stopBtn.addEventListener('click', function() {
        speechSynthesis.cancel();
    });
    
    // Download TTS as audio
    downloadBtn.addEventListener('click', function() {
        const text = translatedText.value || ttsText.value;
        if (!text.trim()) {
            alert('Please enter some text first.');
            return;
        }
        
        // For a real implementation, you would need a TTS API that supports audio file generation
        // This is a simplified version that simulates the process
        alert('In a full implementation, this would generate and download an audio file. For now, use your browser\'s text-to-speech functionality.');
        
        // Save to history
        saveToHistory('tts', text, {
            voice: voiceSelect.value,
            emotion: emotionSelect.value,
            rate: rateSlider.value,
            pitch: pitchSlider.value,
            volume: volumeSlider.value
        });
    });
    
    // Translation functionality
    translateBtn.addEventListener('click', function() {
        const text = ttsText.value;
        if (!text.trim()) {
            alert('Please enter some text to translate.');
            return;
        }
        
        const source = sourceLang.value;
        const target = targetLang.value;
        
        if (source === target) {
            translatedText.value = text;
            return;
        }
        
        // Simulate translation (in a real app, you'd use a translation API)
        translatedText.value = `[Translated from ${source} to ${target}]: ${text}`;
        
        // In a real implementation, you would call a translation API here
        // For example:
        /*
        fetch(`https://translation-api.example.com/translate?source=${source}&target=${target}&text=${encodeURIComponent(text)}`)
            .then(response => response.json())
            .then(data => {
                translatedText.value = data.translatedText;
            })
            .catch(error => {
                console.error('Translation error:', error);
                alert('Translation failed. Please try again.');
            });
        */
    });
    
    // Save custom voice
    saveVoiceBtn.addEventListener('click', function() {
        const customVoice = {
            name: `Custom Voice ${document.querySelectorAll('#voiceSelect option').length - voices.length + 1}`,
            nasality: nasalitySlider.value,
            breathiness: breathinessSlider.value,
            roughness: roughnessSlider.value,
            rate: rateSlider.value,
            pitch: pitchSlider.value,
            volume: volumeSlider.value
        };
        
        const customVoices = JSON.parse(localStorage.getItem('customVoices')) || [];
        customVoices.push(customVoice);
        localStorage.setItem('customVoices', JSON.stringify(customVoices));
        
        // Reload voices to include the new custom voice
        loadVoices();
        
        alert('Custom voice saved successfully!');
    });
}

// Speech-to-Text Functionality
function initSTT() {
    // DOM Elements
    const startRecordingBtn = document.getElementById('startRecordingBtn');
    const stopRecordingBtn = document.getElementById('stopRecordingBtn');
    const copyTextBtn = document.getElementById('copyTextBtn');
    const transcribedText = document.getElementById('transcribedText');
    const sttLanguage = document.getElementById('sttLanguage');
    const enableTranslation = document.getElementById('enableTranslation');
    const sttTargetLanguage = document.getElementById('sttTargetLanguage');
    const translationOutput = document.getElementById('translationOutput');
    const translatedSttText = document.getElementById('translatedSttText');
    
    // STT variables
    let recognition;
    let isRecording = false;
    
    // Check browser support
    if (!('webkitSpeechRecognition' in window) {
        startRecordingBtn.disabled = true;
        startRecordingBtn.title = 'Speech recognition not supported in your browser';
        alert('Speech recognition is not supported in your browser. Try Chrome or Edge.');
        return;
    }
    
    // Initialize speech recogni
