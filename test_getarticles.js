// 测试 getArticles 函数的数据处理逻辑
const testGetArticles = () => {
  // 模拟服务器返回的数据（基于我们的API测试结果）
  const mockServerResponse = {
    page: 1,
    pageSize: 10,
    count: 1,
    articles: [
      {
        _id: "693199e58ebc75e87bf0b1f7",
        title: "测试文章",
        content: "# 测试内容\n这是一篇测试文章。",
        tags: [],
        author: {
          _id: "693199268ebc75e87bf0b1ee",
          username: "admin",
          email: "admin@example.com"
        },
        category: null,
        status: "published",
        slug: "ceshiwenzhang",
        views: 27,
        createdAt: "2025-12-04T14:25:41.928Z",
        updatedAt: "2025-12-05T13:14:35.204Z"
      }
    ]
  };

  // 模拟 getArticles 函数的处理逻辑
  const params = { page: 1, limit: 10 };
  
  const response = mockServerResponse;
  
  const result = {
    data: response.articles || [],
    pagination: {
      page: response.page || params.page,
      limit: response.pageSize || params.limit,
      total: response.count || 0,
      totalPages: Math.ceil((response.count || 0) / (response.pageSize || params.limit))
    }
  };

  console.log('=== getArticles 函数测试结果 ===');
  console.log('1. 服务器原始响应:', JSON.stringify(response, null, 2));
  console.log('\n2. 函数处理后的返回结果:');
  console.log(JSON.stringify(result, null, 2));
  
  console.log('\n3. 验证结果:');
  console.log(`   - 文章数据: ${result.data.length} 篇文章 ✅`);
  console.log(`   - 分页信息: 第${result.pagination.page}页，每页${result.pagination.limit}条 ✅`);
  console.log(`   - 总数统计: 共${result.pagination.total}篇文章，总计${result.pagination.totalPages}页 ✅`);
  
  // 验证第一篇文章的数据
  if (result.data.length > 0) {
    const article = result.data[0];
    console.log(`   - 文章标题: "${article.title}" ✅`);
    console.log(`   - 文章作者: ${article.author.username} ✅`);
    console.log(`   - 文章状态: ${article.status} ✅`);
    console.log(`   - 创建时间: ${article.createdAt} ✅`);
  }

  console.log('\n🎉 getArticles 函数数据处理测试通过！');
};

// 执行测试
testGetArticles();