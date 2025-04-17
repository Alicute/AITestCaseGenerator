// 从默认文件加载测试用例数据
export async function loadDefaultCases() {
    try {
      // 默认测试用例文件列表
      const files = ['data/workflow.json', 'data/testcases.json', 'data/testcases2.json'];
      let cases = [];
      let sourceMap = {};
      let fileNames = [];
      
      for (const file of files) {
        try {
          const response = await fetch(file);
          if (response.ok) {
            const data = await response.json();
            // 记录当前用例在数组中的索引范围
            const startIndex = cases.length;
            cases = cases.concat(data.testCases);
            const endIndex = cases.length - 1;
            
            // 存储用例索引与源文件的关系
            const fileName = file.split('/').pop();
            fileNames.push(fileName);
            
            for (let i = startIndex; i <= endIndex; i++) {
              sourceMap[i] = fileName;
            }
            
            console.log(`成功加载文件: ${file}`);
          }
        } catch (err) {
          console.warn(`加载 ${file} 时出错: ${err.message}`);
        }
      }
      
      return { cases, sourceMap, fileNames };
    } catch (error) {
      console.error('加载测试用例失败:', error);
      return { cases: [], sourceMap: {}, fileNames: [] };
    }
  }
  
  // 从上传的文件加载测试用例
  export function loadCasesFromFiles(files) {
    return new Promise((resolve) => {
      let cases = [];
      let sourceMap = {};
      let fileNames = [];
      let filesProcessed = 0;
      
      Array.from(files).forEach(file => {
        fileNames.push(file.name);
        const reader = new FileReader();
        
        reader.onload = function(e) {
          try {
            const data = JSON.parse(e.target.result);
            if (data.testCases && Array.isArray(data.testCases)) {
              // 记录当前用例在数组中的索引范围
              const startIndex = cases.length;
              cases = cases.concat(data.testCases);
              const endIndex = cases.length - 1;
              
              // 存储用例索引与源文件的关系
              for (let i = startIndex; i <= endIndex; i++) {
                sourceMap[i] = file.name;
              }
              
              console.log(`成功加载文件: ${file.name}`);
            } else {
              console.warn(`文件格式不正确: ${file.name}`);
            }
          } catch (err) {
            console.error(`解析文件 ${file.name} 时出错:`, err);
          }
          
          // 增加处理计数
          filesProcessed++;
          
          // 检查是否所有文件都已处理完毕
          if (filesProcessed === files.length) {
            resolve({ cases, sourceMap, fileNames });
          }
        };
        
        reader.onerror = function() {
          console.error(`读取文件 ${file.name} 时出错`);
          filesProcessed++;
          
          if (filesProcessed === files.length) {
            resolve({ cases, sourceMap, fileNames });
          }
        };
        
        reader.readAsText(file);
      });
      
      // 如果没有文件，立即返回空结果
      if (files.length === 0) {
        resolve({ cases, sourceMap, fileNames });
      }
    });
  }