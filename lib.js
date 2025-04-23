export function math2img(expr) {
  let url = `/edushop/tiku/submit/genexprpic?expr=${encodeURIComponent(expr)}`;

  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const img = document.createElement('img');
      img.src = data.data.url;
      img.style = `width: ${data.data.width}px;height: ${data.data.height}px;`;
      img.setAttribute("data-math", data.data.exprEncode);
      img.setAttribute("data-width", data.data.width);
      img.setAttribute("data-height", data.data.height);
      return img;
    })
    .catch(error => {
      console.error(error);
      return null;
    });
}

export async function img_upload(imageBlob) {
  const url = "/edushop/tiku/submit/uploadpic";

  const formData = new FormData();
  formData.append('file', imageBlob, 'math.png');

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export async function getAuditTaskLabel(taskType = 'audittask') {
  const url = `/edushop/question/${taskType}/getlabel`;

  try {
    const response = await fetch(url, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting audit task label:', error);
    throw error;
  }
}

export async function getAuditTaskList({
  pn = 1,
  rn = 20,
  clueID = '',
  clueType = 1,
  step = 1,
  subject = 2,
  taskType = 'audittask'
} = {}) {
  try {
    const queryParams = new URLSearchParams({
      pn,
      rn,
      clueID,
      clueType,
      step,
      subject
    });

    const response = await fetch(`/edushop/question/${taskType}/list?${queryParams}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching audit task list:', error);
    throw error;
  }
}

export async function claimAuditTask(taskIDs, taskType = 'audittask') {
  const commitType = taskType === 'producetask' ? 'producetaskcommit' : 'audittaskcommit';
  try {
    const requestBody = taskType === 'producetask' 
      ? { clueIDs: taskIDs }
      : { taskIDs };

    const response = await fetch(`/edushop/question/${commitType}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error claiming audit task:', error);
    throw error;
  }
}


export function replacePunctuation(text) {
  const punctuationMap = {
    '\\.$': '。',
    ',': '，',
    '\\?': '？',
    '!': '！',
    ':$': '：',
    //'：': ':',
    ';': '；',
    //'\\(': '（',
    //'\\（': '(',
    //'\\）': ')',
    //'\\)': '）',
    //'\\[': '【',
    //'\\]': '】',
    //'\\{': '｛',
    //'\\}': '｝',
    //'-': '—', // 使用中文长破折号
    '"': '"', // 使用中文双引号
    // "'": ''', // 使用中文单引号
  };

  // 匹配数学表达式的正则
  const mathRegex = /\$([^$]+)\$/g;

  // 将文本中的数学表达式提取出来
  const mathExpressions = [];
  text = text.replace(mathRegex, (match) => {
    mathExpressions.push(match);
    return `{{math${mathExpressions.length - 1}}}`; // 用占位符替换
  });

  // 去除行内字符之间的多余空格，但保留每行前后的空格
  text = text.replace(/ +/g, ''); // 将多个空格替换为一个空格

  let result = text;
  for (const [englishPunctuation, chinesePunctuation] of Object.entries(punctuationMap)) {
    result = result.replace(new RegExp(englishPunctuation, 'g'), chinesePunctuation);
  }


  result = result.replace(/\(\)/g, '（ ）');
  result = result.replace(/（）/g, '（ ）');
  // 处理单个字符的情况，包括字母，排除括号内有运算符的情况
  result = result.replace(/\(([0-9a-zA-Z\u4e00-\u9fa5])\)(?![0-9])(?![+\-*/])/g, '（$1）');
  // 处理多个字符的情况，包括字母
  result = result.replace(/\(([\u4e00-\u9fa5a-zA-Z]+)\)/g, '（$1）');
  // 处理括号内数字和中文混合的情况，如(3分)
  result = result.replace(/\((\d+[\u4e00-\u9fa5]+)\)/g, '（$1）');
  result = result.replace(/\(([\u4e00-\u9fa5]+\d+)\)/g, '（$1）');
  result = result.replace(/\((\d+[\u4e00-\u9fa5]+\d+)\)/g, '（$1）');
  // 处理字符前后带括号的情况，排除括号内有运算符的情况
  result = result.replace(/([\u4e00-\u9fa5a-zA-Z]+)\(([^+\-*/]+?)\)/g, '$1（$2）');
  // 处理序号格式，即使后面跟着数字也会替换
  result = result.replace(/\((\d+)\)(?=\d)(?![+\-*/])/g, '（$1）');
  result = result.replace(/([^+\-*/]):/g, '$1：');
  result = result.replace(/(?<=[\u4e00-\u9fa5])\:(?=[\u4e00-\u9fa5])/g, '：');
  result = result.replace(/(?<=[)）])\:/g, '：');


  // 将占位符替换回原来的数学表达式
  mathExpressions.forEach((expr, index) => {
    result = result.replace(`{{math${index}}}`, expr);
  });

  return result;
}


export async function run_llm(host, uname, item, data) {
  try {
    const response = await fetch(`${host}/llm/run/${item}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData.topic;
  } catch (error) {
    console.error('Error formatting topic:', error);
    return null;
  }
}

export async function format_latex(host, uname, text) {
  try {
    const response = await fetch(`${host}/llm/format_latex`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData.topic;
  } catch (error) {
    console.error('Error formatting LaTeX:', error);
    return null;
  }
}

export async function topic_type_list(host, uname, discipline) {
  try {
    const queryParams = new URLSearchParams();
    if (discipline) {
      queryParams.append('discipline', discipline);
    }
    const queryString = queryParams.toString();
    const url = `${host}/llm/topic_type_list${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error formatting topic:', error);
    return null;
  }
}

export async function discipline_list(host, uname) {
  try {
    const response = await fetch(`${host}/llm/discipline_list`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error getting discipline list:', error);
    return null;
  }
}

export async function user_info(host, uname) {
  try {
    const response = await fetch(`${host}/user/info`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error formatting topic:', error);
    return null;
  }
}


export async function reset_fingerprint(host, uname) {
  try {
    const response = await fetch(`${host}/fingerprint/reset`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error reset fingerprint:', error);
    return null;
  }
}

export async function ocr_text(image_data, host, uname) {
  try {
    const response = await fetch(`${host}/llm/ocr`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
      body: JSON.stringify(image_data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error ocr:', error);
    return null;
  }
}

export async function topic_split(text_data, host, uname) {
  try {
    const response = await fetch(`${host}/llm/topic_split`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
      body: JSON.stringify(text_data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Return the full data object instead of just topics
    // This allows the component to access both text and list fields
    return data;
  } catch (error) {
    console.error('Error topic split:', error);
    return null;
  }
}

export async function replaceLatexWithImages(text) {
  // Convert \( and \) to $
  text = text.replace(/\\\(/g, '$').replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$').replace(/\\\]/g, '$');

  const regex = /\$([^$]+)\$/g;
  let result = text;
  const matches = [...text.matchAll(regex)];

  for (const match of matches) {
    const fullMatch = match[0];
    let expression = match[1];
    // 替换 HTML 符号为文本符号
    expression = expression
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&copy;/g, '©')
      .replace(/&reg;/g, '®')
      .replace(/&euro;/g, '€')
      .replace(/&yen;/g, '¥')
      .replace(/<\/span>/g,'')
      .replace(/<span>/g, '')
      .replace(/<br>/g, '');
    const imgElement = await math2img(expression);
    result = result.replace(fullMatch, imgElement.outerHTML);
  }

  return result;
}

export async function replaceLatexWithImagesInHtml(htmlText) {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlText;

  // Function to process text nodes containing LaTeX
  async function processTextNode(node) {
    const text = node.textContent;

    // Convert \( and \) to $
    let processedText = text.replace(/\\\(/g, '$').replace(/\\\)/g, '$')
      .replace(/\\\[/g, '$').replace(/\\\]/g, '$');

    const regex = /\$([^$]+)\$/g;
    const matches = [...processedText.matchAll(regex)];

    if (matches.length === 0) return;

    // Create a document fragment to hold processed content
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const match of matches) {
      const fullMatch = match[0];
      let expression = match[1];

      // Replace HTML entities
      expression = expression
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®')
        .replace(/&euro;/g, '€')
        .replace(/&yen;/g, '¥');

      // Add text before the LaTeX
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(processedText.slice(lastIndex, match.index)));
      }

      // Get and append the image
      const imgElement = await math2img(expression);
      if (imgElement) {
        fragment.appendChild(imgElement);
      }

      lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text after the last LaTeX
    if (lastIndex < processedText.length) {
      fragment.appendChild(document.createTextNode(processedText.slice(lastIndex)));
    }

    // Replace the original text node with the processed fragment
    node.parentNode.replaceChild(fragment, node);
  }

  // Function to traverse the DOM tree
  async function traverseNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      await processTextNode(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Skip script and style elements
      if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') {
        return;
      }

      // Process child nodes
      const childNodes = Array.from(node.childNodes);
      for (const childNode of childNodes) {
        await traverseNode(childNode);
      }
    }
  }

  // Process all nodes in the temporary div
  await traverseNode(tempDiv);

  // Return the processed HTML
  return tempDiv.innerHTML;
}
