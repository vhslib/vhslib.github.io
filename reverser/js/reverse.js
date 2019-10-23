(() => {
    if (!window.modules) window.modules = {}

    window.modules.reverse = {
        reversePhonetically
    }

    function reversePhonetically(input) {
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
        return isSimpleVowel(letter) || isSofteningVowel(letter)
    }

    function isEmpty(string) {
        return !string || string === ' ' || string === '\n'
    }

    let diphtongToSimple = {
        'е': 'э',
        'ё': 'о',
        'ю': 'у',
        'я': 'а',
        'и': 'ы'
    }

    let simpleToDiphtong = {
        'э': 'е',
        'о': 'ё',
        'у': 'ю',
        'а': 'я',
        'ы': 'и'
    }

    /* Letter { value: string, soft: boolean, stressed: boolean } */

    function parse(string) {
        let array = []
        let stressed = false

        for (let i = 0; i < string.length; i++) {
            if (string[i] === '\'') {
                stressed = true
                continue
            }

            if (isSofteningVowel(string[i])) {
                let previousLetter = stressed ? string[i - 2] : string[i - 1]

                if (canBeSoftened(previousLetter)) {
                    array[array.length - 1].soft = true
                    array.push({ value: diphtongToSimple[string[i]], stressed })
                }
                else {
                    if (string[i] === 'и') {
                        if (isEmpty(previousLetter)) {
                            array.push({ value: 'и', stressed })
                        }
                        else {
                            array.push({ value: diphtongToSimple[string[i]], stressed })
                        }
                    }
                    else if (isEmpty(previousLetter) || isVowel(previousLetter) || previousLetter === 'ъ') {
                        array.push({ value: 'й' })
                        array.push({ value: diphtongToSimple[string[i]], stressed })
                    }
                    else {
                        array.push({ value: diphtongToSimple[string[i]], stressed })
                    }
                }
            }
            else if (string[i] === 'ь' && canBeSoftened(string[i - 1])) {
                array[array.length - 1].soft = true
            }
            else if (string[i] === 'ц') {
                array.push({ value: 'т' })
                array.push({ value: 'с' })
            }
            else if (string[i] !== 'ъ') {
                array.push({ value: string[i], stressed })
            }

            stressed = false
        }

        return array
    }

    function reverse(array) {
        return array.slice().reverse()
    }

    function stringify(array) {
        let string = ''

        for (let i = 0; i < array.length; i++) {
            if (array[i].soft) {
                if (array[i + 1] && isSimpleVowel(array[i + 1].value)) {
                    string += array[i].value
                    string += simpleToDiphtong[array[i + 1].value]

                    if (array[i + 1].stressed) {
                        string += String.fromCharCode(769)
                    }

                    i++
                }
                else {
                    string += array[i].value
                    string += 'ь'
                }
            }
            else if (array[i].value === 'й') {
                if (array[i + 1] && array[i + 1].value === 'ы') {
                    string += 'й'
                    string += 'ы'

                    if (array[i + 1].stressed) {
                        string += String.fromCharCode(769)
                    }

                    i++
                }
                else if (array[i + 1] && isSimpleVowel(array[i + 1].value)) {
                    string += simpleToDiphtong[array[i + 1].value]

                    if (array[i + 1].stressed) {
                        string += String.fromCharCode(769)
                    }

                    i++
                }
                else {
                    string += 'й'
                }
            }
            else if (array[i].value === 'т' && array[i + 1] && array[i + 1].value === 'с') {
                string += 'ц'
                i++
            }
            else {
                string += array[i].value

                if (array[i].stressed) {
                    string += String.fromCharCode(769)
                }
            }
        }

        return string
    }
})()