(() => {
    if (!window.modules) window.modules = {}

    window.modules.reverse = {
        reversePhonetically
    }

    // Option whether to convert ч to тщ and vice versa
    let convertCh

    function reversePhonetically(input, _convertCh) {
        convertCh = _convertCh
        return stringify(reverse(parse(input.toLowerCase())))
    }

    /* Helper functions */
    function canBeSoftened(letter) {
        return 'бвгдзклмнпрстфх'.split('').includes(letter)
    }

    function isSofteningVowel(letter) {
        return 'еёюяи'.split('').includes(letter)
    }

    function isSimpleVowel(letter) {
        return 'эоуаы'.split('').includes(letter)
    }

    function isVowel(letter) {
        return 'еёюяиэоуаы'.split('').includes(letter)
    }

    function isConsonant(letter) {
        return 'бвгджзклмнпрстфхцчшщ'.split('').includes(letter)
    }

    function isEmpty(string) {
        return !string || string === ' ' || string === '\n' || string === '\r'
    }

    /* Mappings */
    let softeningToSimple = {
        'е': 'э',
        'ё': 'о',
        'ю': 'у',
        'я': 'а',
        'и': 'ы'
    }

    let simpleToSoftening = {
        'э': 'е',
        'о': 'ё',
        'у': 'ю',
        'а': 'я',
        'ы': 'и'
    }

    /* Turn a string into an array of Letters: */
    /* Letter { value: string, soft: boolean, stressed: boolean } */
    function parse(string) {
        let array = []

        // Temporary stress flag, see below
        let stressed = false

        for (let i = 0; i < string.length; i++) {
            // Check for ' sign which indicates that the next vowel is stressed
            if (string[i] === '\'') {
                stressed = true
                continue
            }

            if (isSofteningVowel(string[i])) {
                // Get the letter before the current letter
                // It normally has index i - 1
                // But if we have a stressed vowel, note that index i - 1 is
                // actually an apostrophe, so get the letter before it
                let previousLetter = stressed ? string[i - 2] : string[i - 1]

                if (canBeSoftened(previousLetter)) {
                    // Soften the previous letter
                    array[array.length - 1].soft = true

                    // Add the corresponding simple letter
                    array.push({ value: softeningToSimple[string[i]], stressed })
                }
                else if (string[i] === 'и') {
                    // Quite a complex case
                    // 1. If the previous letter is a consonant (ANY),
                    // replace и with ы
                    // 2. If the next letter is a consonant (ANY),
                    // preserve и and insert separating ъ
                    // 3. Otherwise, just preserve

                    if (isConsonant(previousLetter)) {
                        array.push({ value: 'ы', stressed })
                    }
                    else if (isConsonant(string[i + 1])) {
                        array.push({ value: 'и', stressed })
                        array.push({ value: 'ъ' })
                    }
                    else {
                        array.push({ value: 'и', stressed })
                    }
                }
                // Softening and not и => it's iotated vowel
                else if (isEmpty(previousLetter) || isVowel(previousLetter) || previousLetter === 'ъ') {
                    // In the beginning of the word,
                    // after a vowel or after ъ
                    // it is iotated
                    array.push({ value: 'й' })
                    array.push({ value: softeningToSimple[string[i]], stressed })
                }
                else {
                    // In other positions it is not iotated
                    array.push({ value: softeningToSimple[string[i]], stressed })
                }
            }
            else if (string[i] === 'ь') {
                if (canBeSoftened(string[i - 1])) {
                    // Complex case
                    // 1. If ь is between a consonant and a softening vowel,
                    // the consonant is softened and the vowel is iotated
                    // 2. Otherwise, the consonant is just softened

                    let nextLetter

                    if (string[i + 1] === '\'') nextLetter = string[i + 2]
                    else nextLetter = string[i + 1]

                    if (isSofteningVowel(nextLetter)) {
                        if (string[i + 1] === '\'') {
                            stressed = true
                        }

                        array[array.length - 1].soft = true
                        array.push({ value: 'й' })
                        array.push({ value: softeningToSimple[nextLetter], stressed })

                        // Next letter already handled
                        i++
                    }
                    else {
                        array[array.length - 1].soft = true
                    }
                }

            }
            else if (string[i] === 'ц') {
                // Ц actually sounds quite like тс
                array.push({ value: 'т' })
                array.push({ value: 'с' })
            }
            else if (string[i] === 'ч' && convertCh) {
                // Ч actually sounds quite like тщ
                array.push({ value: 'т' })
                array.push({ value: 'щ' })
            }
            else if (string[i] !== 'ъ') {
                // Push every other letter except ъ
                array.push({ value: string[i], stressed })
            }

            stressed = false
        }

        return array
    }

    function reverse(array) {
        let reversed = array.slice().reverse()

        // Normalize a bit (convert тс to ц, тщ to ч)

        let normalized = []

        for (let i = 0; i < reversed.length; i++) {
            if (
                // тс
                reversed[i].value === 'т'
                && reversed[i].soft !== true
                && reversed[i + 1]
                && reversed[i + 1].value === 'с'
            ) {
                normalized.push({ value: 'ц' })
                i++
            }
            else if (
                // тщ
                reversed[i].value === 'т'
                && reversed[i].soft !== true
                && reversed[i + 1]
                && reversed[i + 1].value === 'щ'
                && convertCh
            ) {
                normalized.push({ value: 'ч' })
                i++
            }
            else {
                normalized.push(reversed[i])
            }
        }

        return normalized
    }

    /* Turn an array of Letters back into a string */
    function stringify(array) {
        let string = ''
        let STRESS_SIGN = String.fromCharCode(769)

        for (let i = 0; i < array.length; i++) {
            if (array[i].value === 'й') {
                if (array[i + 1] && array[i + 1].value === 'ы') {
                    string += 'йы'

                    if (array[i + 1].stressed) {
                        string += STRESS_SIGN
                    }

                    // Next letter already handled
                    i++
                }
                else if (array[i + 1] && isSimpleVowel(array[i + 1].value)) {
                    // Add separating ъ if the previous letter can be softened
                    // to prevent it from being softened
                    if (string[string.length - 1] !== 'ь' && array[i - 1] && canBeSoftened(array[i - 1].value)) {
                        string += 'ъ'
                    }

                    string += simpleToSoftening[array[i + 1].value]

                    if (array[i + 1].stressed) {
                        string += STRESS_SIGN
                    }

                    // Next letter already handled
                    i++
                }
                else {
                    string += 'й'
                }
            }
            else if (array[i].soft) {
                // The letter is soft
                if (array[i + 1] && isSimpleVowel(array[i + 1].value)) {
                    // The next letter is a simple vowel, replace with the softening one
                    // Like "д'элать" -> "делать"

                    string += array[i].value
                    string += simpleToSoftening[array[i + 1].value]

                    if (array[i + 1].stressed) {
                        string += STRESS_SIGN
                    }

                    // Skip the next letter as it has been handled
                    i++
                }
                else {
                    // No vowel next, insert the letter and ь
                    string += array[i].value
                    string += 'ь'
                }
            }
            else if (
                    isConsonant(array[i].value)
                    && !canBeSoftened(array[i].value)
                    && array[i + 1]
                    && (array[i + 1].value === 'э' || array[i + 1].value === 'ы')
                ) {
                    string += array[i].value
                    string += simpleToSoftening[array[i + 1].value]

                    if (array[i + 1].stressed) {
                        string += STRESS_SIGN
                    }

                    // Skip the next letter as it has been handled
                    i++
            }
            else {
                string += array[i].value

                if (array[i].stressed) {
                    string += STRESS_SIGN
                }
            }
        }

        return string
    }
})()
