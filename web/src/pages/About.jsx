export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="max-w-6xl mx-auto p-8 pt-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-6">
            🎮 About GameHub Kids 🌟
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Your trusted companion for discovering amazing, safe, and
            educational games for children of all ages!
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="text-6xl mb-6 text-center">🎯</div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 text-center">
              Our Mission
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">
              We believe every child deserves access to high-quality,
              educational, and fun games. Our platform helps parents and kids
              discover games that are not only entertaining but also promote
              learning, creativity, and positive social interaction.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="text-6xl mb-6 text-center">🔒</div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 text-center">
              Safety First
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">
              All games on our platform are carefully reviewed for
              age-appropriate content. We provide detailed age ratings, content
              descriptions, and safety information to help parents make informed
              decisions about their children's gaming experience.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl p-12 mb-16 text-white">
          <h2 className="text-4xl font-bold text-center mb-12">
            🌟 What Makes Us Special
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-bold mb-3">Family Friendly</h3>
              <p className="text-white/90">
                Every game is suitable for family play and promotes positive
                values
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🧠</div>
              <h3 className="text-xl font-bold mb-3">Educational Value</h3>
              <p className="text-white/90">
                Games that combine fun with learning to help kids develop new
                skills
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-3">Quality Assured</h3>
              <p className="text-white/90">
                Only top-rated, well-reviewed games make it to our platform
              </p>
            </div>
          </div>
        </div>

        {/* Age Groups Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-white">
            🎂 Perfect for Every Age
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-green-100 dark:bg-green-900 rounded-2xl p-6 text-center hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">👶</div>
              <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                Ages 3-5
              </h3>
              <p className="text-green-600 dark:text-green-300 text-sm">
                Simple, colorful games that develop basic skills
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 rounded-2xl p-6 text-center hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">🧒</div>
              <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                Ages 6-8
              </h3>
              <p className="text-blue-600 dark:text-blue-300 text-sm">
                Adventure games that encourage exploration and creativity
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 rounded-2xl p-6 text-center hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">👦</div>
              <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200 mb-2">
                Ages 9-12
              </h3>
              <p className="text-purple-600 dark:text-purple-300 text-sm">
                Strategy and puzzle games that challenge thinking
              </p>
            </div>
            <div className="bg-pink-100 dark:bg-pink-900 rounded-2xl p-6 text-center hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">👩‍🦱</div>
              <h3 className="text-xl font-bold text-pink-800 dark:text-pink-200 mb-2">
                Ages 13+
              </h3>
              <p className="text-pink-600 dark:text-pink-300 text-sm">
                Complex games that prepare for advanced learning
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
            🚀 Ready to Start Your Gaming Journey?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of families who trust GameHub Kids to find the
            perfect games for their children. Safe, fun, and educational gaming
            starts here!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-full hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg">
              🎮 Explore Games
            </button>
            <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-4 px-8 rounded-full hover:from-blue-600 hover:to-green-600 transform hover:scale-105 transition-all duration-200 shadow-lg">
              📧 Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
