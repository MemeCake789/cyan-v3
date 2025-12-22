<script>

</script>

<main>
  <section class="left">
    <header class="header">
      
    </header>
    <nav class="nav">nav</nav>
    <footer class="footer">footer</footer>
  </section>
  <section class="right">
    <div class="window-area">window-area</div>
  </section>
</main>

<style>
  :global(body, html) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  main {
    display: flex;
    width: 100vw;
    height: 100vh;
    background-color: #000000;
    padding: 20px;
    box-sizing: border-box;
  }

  .left {
    display: flex;
    flex-direction: column;
    width: 30%;
    margin-right: 20px;
  }

  .right {
    width: 70%;
  }

  .header, .nav, .footer, .window-area {
    border: 1px solid #555;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: sans-serif;
  }

  .header {
    height: 20%;
    margin-bottom: 10px;
    background-color: #000;
  }

  .nav {
    flex-grow: 1;
    margin-bottom: 10px;
    background-color: #000;
  }

  .footer {
    height: 15%;
    background-color: #000;
  }

  .window-area {
    width: 100%;
    height: 100%;
    background-color: #d3d3d3;
    color: black;
  }
</style>